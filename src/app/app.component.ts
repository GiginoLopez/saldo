
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import * as XLSX from 'xlsx';

import { AnnualExpense, MonthlyExpense, MonthlyIncome, OneOffIncome, PrepaidSnapshot, Year, YearData } from './models';
import { StorageService } from './services/storage.service';
import { BudgetService } from './services/budget.service';
import { Chart } from 'chart.js';

function uid(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }

@Component({ selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.scss'] })
export class AppComponent implements OnInit {
  title = 'Conti • Previsionale CC + Carta Prepagata';

  years: Year[] = [];
  currentYear: Year = new Date().getFullYear();
  data: YearData | null = null;

  showOnlyNegative = false;

  configForm = this.fb.group({ saldoInizialeCC: [0, [Validators.required, Validators.min(0)]], saldoFinaleDesideratoCC: [0, [Validators.required, Validators.min(0)]] });
  monthlyExpenseForm = this.fb.group({ descrizione: ['', [Validators.required]], importo: [0, [Validators.required, Validators.min(0.01)]] });
  annualExpenseForm = this.fb.group({ descrizione: ['', [Validators.required]], importo: [0, [Validators.required, Validators.min(0.01)]], mese: [1, [Validators.required, Validators.min(1), Validators.max(12)]] });
  monthlyIncomeForm = this.fb.group({ descrizione: ['', [Validators.required]], importo: [0, [Validators.required, Validators.min(0.01)]], type: ['stipendio', Validators.required] });
  oneOffIncomeForm = this.fb.group({ descrizione: ['', [Validators.required]], importo: [0, [Validators.required, Validators.min(0.01)]], mese: [1, [Validators.required, Validators.min(1), Validators.max(12)]], type: ['altro', Validators.required] });
  prepaidForm = this.fb.group({ saldo: [0, [Validators.required, Validators.min(0)]], note: [''] });

  forecast: ReturnType<BudgetService['computeForecast']> | null = null;

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  constructor(private fb: FormBuilder, private storage: StorageService, private budget: BudgetService) {}

  ngOnInit() {
    const st = this.storage.load(); this.years = st.years.sort(); if (!this.years.includes(this.currentYear)) this.currentYear = this.years[0]; this.loadYear(this.currentYear);
    if (this.data) this.patchConfig();
    this.configForm.valueChanges.pipe(debounceTime(300), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))).subscribe(val => {
      if (!this.data) return; this.data.config.saldoInizialeCC = Number(val.saldoInizialeCC || 0); this.data.config.saldoFinaleDesideratoCC = Number(val.saldoFinaleDesideratoCC || 0); this.persist();
    });
  }

  get fCfg() { return this.configForm.controls; }
  ctrlInvalid(ctrl: any) { return ctrl.invalid && (ctrl.dirty || ctrl.touched); }

  private patchConfig() { if (!this.data) return; this.configForm.patchValue({ saldoInizialeCC: this.data.config.saldoInizialeCC, saldoFinaleDesideratoCC: this.data.config.saldoFinaleDesideratoCC }, { emitEvent: false }); }

  loadYear(y: Year) { this.currentYear = y; const d = this.storage.getYearData(y); this.data = JSON.parse(JSON.stringify(d)); this.forecast = null; this.patchConfig(); this.destroyChart(); }
  addYear() { const now = new Date().getFullYear(); const y = (this.years[this.years.length - 1] || now) + 1; this.storage.upsertYear(y); this.years = [...this.years, y].sort(); this.loadYear(y); }

  addMonthlyExpense() { if (!this.data) return; if (this.monthlyExpenseForm.invalid) { this.monthlyExpenseForm.markAllAsTouched(); return; } const v = this.monthlyExpenseForm.value; const it: MonthlyExpense = { id: uid('mexp'), descrizione: v.descrizione!, importo: Number(v.importo), active: true }; this.data.monthlyExpenses.push(it); this.monthlyExpenseForm.reset({ descrizione: '', importo: 0 }); this.persist(); }
  toggleMonthlyExpense(id: string) { if (!this.data) return; const it = this.data.monthlyExpenses.find(x => x.id === id); if (it) { it.active = !it.active; this.persist(); } }
  removeMonthlyExpense(id: string) { if (!this.data) return; this.data.monthlyExpenses = this.data.monthlyExpenses.filter(x => x.id !== id); this.persist(); }

  addAnnualExpense() { if (!this.data) return; if (this.annualExpenseForm.invalid) { this.annualExpenseForm.markAllAsTouched(); return; } const v = this.annualExpenseForm.value; const it: AnnualExpense = { id: uid('aexp'), descrizione: v.descrizione!, importo: Number(v.importo), mese: Number(v.mese) }; this.data.annualExpenses.push(it); this.annualExpenseForm.reset({ descrizione: '', importo: 0, mese: 1 }); this.persist(); }
  removeAnnualExpense(id: string) { if (!this.data) return; this.data.annualExpenses = this.data.annualExpenses.filter(x => x.id !== id); this.persist(); }

  addMonthlyIncome() { if (!this.data) return; if (this.monthlyIncomeForm.invalid) { this.monthlyIncomeForm.markAllAsTouched(); return; } const v = this.monthlyIncomeForm.value as any; const it: MonthlyIncome = { id: uid('minc'), descrizione: v.descrizione, importo: Number(v.importo), type: v.type }; this.data.monthlyIncomes.push(it); this.monthlyIncomeForm.reset({ descrizione: '', importo: 0, type: 'stipendio' }); this.persist(); }
  removeMonthlyIncome(id: string) { if (!this.data) return; this.data.monthlyIncomes = this.data.monthlyIncomes.filter(x => x.id !== id); this.persist(); }

  addOneOffIncome() { if (!this.data) return; if (this.oneOffIncomeForm.invalid) { this.oneOffIncomeForm.markAllAsTouched(); return; } const v = this.oneOffIncomeForm.value as any; const it: OneOffIncome = { id: uid('oinc'), descrizione: v.descrizione, importo: Number(v.importo), mese: Number(v.mese), type: v.type }; this.data.oneOffIncomes.push(it); this.oneOffIncomeForm.reset({ descrizione: '', importo: 0, mese: 1, type: 'altro' }); this.persist(); }
  removeOneOffIncome(id: string) { if (!this.data) return; this.data.oneOffIncomes = this.data.oneOffIncomes.filter(x => x.id !== id); this.persist(); }

  addPrepaidSnapshot() { if (!this.data) return; if (this.prepaidForm.invalid) { this.prepaidForm.markAllAsTouched(); return; } const v = this.prepaidForm.value as any; const it: PrepaidSnapshot = { id: uid('pp'), date: new Date().toISOString(), saldo: Number(v.saldo || 0), note: v.note || '' }; this.data.prepaidSnapshots.push(it); this.prepaidForm.reset({ saldo: 0, note: '' }); this.persist(); }
  lastPrepaidBalance() { if (!this.data || this.data.prepaidSnapshots.length === 0) return null; const s = this.data.prepaidSnapshots.slice().sort((a, b) => a.date.localeCompare(b.date)); return s[s.length - 1]; }

  compute() { if (!this.data) return; this.forecast = this.budget.computeForecast(this.data); this.renderChart(); }
  private persist() { if (!this.data) return; this.storage.upsertYear(this.data.config.year, this.data); }

  exportCSV() {
    if (!this.forecast) this.compute();
    if (!this.forecast) return;
    const header = ['Mese','SaldoAttuale','Entrate','Stipendio','Uscite','Bilancio','BonificoPrepagata','SaldoFinale'];
    const rows = this.filteredMonths().map(m => [
      m.mese, m.saldoAttuale, m.entrate, m.stipendio, m.uscite, m.bilancio, m.bonificoPrepagata, m.saldoFinale
    ].map(v => String(v)));
    const csv = [header, ...rows].map(r => r.join(';')).join('');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `previsionale_${this.currentYear}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  exportExcel() {
    if (!this.forecast) this.compute();
    if (!this.forecast) return;
    const data = this.filteredMonths().map(m=>({
      Mese: m.mese, SaldoAttuale: m.saldoAttuale, Entrate: m.entrate, Stipendio: m.stipendio,
      Uscite: m.uscite, Bilancio: m.bilancio, BonificoPrepagata: m.bonificoPrepagata, SaldoFinale: m.saldoFinale
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Previsionale');
    XLSX.writeFile(wb, `previsionale_${this.currentYear}.xlsx`);
  }

  private destroyChart() { if (this.chart) { this.chart.destroy(); this.chart = null; } }
  private renderChart() {
    if (!this.forecast || !this.chartCanvas) return;
    this.destroyChart();
    const months = this.filteredMonths();
    const labels = months.map(m=>m.mese);
    const saldo = months.map(m=>m.saldoFinale);
    const entrate = months.map(m=>m.entrate);
    const uscite = months.map(m=>m.uscite);

    this.chart = new Chart(this.chartCanvas.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { type: 'line', label: 'Saldo finale CC', data: saldo, borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,.15)', yAxisID: 'y', lineTension: .2 },
          { type: 'bar', label: 'Entrate', data: entrate, backgroundColor: 'rgba(25,135,84,.6)', yAxisID: 'y1' },
          { type: 'bar', label: 'Uscite', data: uscite, backgroundColor: 'rgba(220,53,69,.6)', yAxisID: 'y1' }
        ]
      }
    });
  }

  toggleOnlyNegative() { this.showOnlyNegative = !this.showOnlyNegative; this.renderChart(); }
  filteredMonths() { return this.forecast ? (this.showOnlyNegative ? this.forecast.months.filter(m=>m.saldoFinale<0) : this.forecast.months) : []; }
}
