import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Chart } from 'chart.js';
import { StorageService } from '../services/storage.service';
import { CcSnapshot, Year, YearData } from '../models';

function uid(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2,9)}`; }

@Component({ selector: 'app-saldi', templateUrl: './saldi.component.html', styleUrls: ['./saldi.component.scss'] })
export class SaldiComponent implements OnInit {
  currentYear: Year = new Date().getFullYear();
  data: YearData | null = null;

  form = this.fb.group({
    date: [new Date().toISOString().slice(0,10), [Validators.required]],
    saldo: [0, [Validators.required]],
    note: ['']
  });

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  constructor(private fb: FormBuilder, private storage: StorageService) {}

  ngOnInit(): void {
    this.data = this.storage.getYearData(this.currentYear);
    if (!(this.data as any).ccSnapshots) (this.data as any).ccSnapshots = [];
    this.sortSnapshots();
    setTimeout(() => this.renderChart(), 0);
  }

  get snapshots(): CcSnapshot[] { return this.data?.ccSnapshots ?? []; }

  add() {
    if (!this.data) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value as any;
    const it: CcSnapshot = { id: uid('cc'), date: v.date, saldo: Number(v.saldo||0), note: v.note||'' };
    this.data.ccSnapshots.push(it);
    this.persist();
    this.form.reset({ date: new Date().toISOString().slice(0,10), saldo: 0, note: '' });
    this.sortSnapshots();
    this.renderChart();
  }

  remove(id: string) {
    if (!this.data) return;
    this.data.ccSnapshots = this.data.ccSnapshots.filter(x => x.id !== id);
    this.persist();
    this.renderChart();
  }

  private sortSnapshots() {
    if (!this.data) return;
    this.data.ccSnapshots.sort((a,b)=>a.date.localeCompare(b.date));
  }

  private persist() { if (this.data) this.storage.upsertYear(this.data.config.year, this.data); }

  private destroyChart() { if (this.chart) { this.chart.destroy(); this.chart = null; } }

  // Traiettoria target ricavata dal "Saldo fine periodo" su 13 periodi (Gen..Nov, 13ª, Dic)
  private buildTargetFunction() {
    const cfg = this.data?.config;
    const year = this.currentYear;
    const s0 = (cfg?.saldoInizialeCC ?? 0);
    const sF = (cfg?.saldoFinaleDesideratoCC ?? 0);
    const quota = (sF - s0) / 13;

    const anchors: { t: number; v: number }[] = [];
    anchors.push({ t: new Date(year, 0, 1).getTime(), v: s0 });
    for (let m = 1; m <= 11; m++) {
      const lastDay = new Date(year, m, 0); // last day of month m (1..11 => Jan..Nov)
      anchors.push({ t: lastDay.getTime(), v: s0 + quota * m });
    }
    anchors.push({ t: new Date(year, 11, 15).getTime(), v: s0 + quota * 12 }); // 13ª
    anchors.push({ t: new Date(year, 11, 31).getTime(), v: s0 + quota * 13 }); // Dic

    const f = (dateISO: string) => {
      const t = new Date(dateISO).getTime();
      if (t <= anchors[0].t) return anchors[0].v;
      if (t >= anchors[anchors.length - 1].t) return anchors[anchors.length - 1].v;
      for (let i = 1; i < anchors.length; i++) {
        const a = anchors[i - 1];
        const b = anchors[i];
        if (t <= b.t) {
          const w = (t - a.t) / Math.max(1, (b.t - a.t));
          return a.v + (b.v - a.v) * w;
        }
      }
      return anchors[anchors.length - 1].v;
    };
    return f;
  }

  private renderChart() {
    if (!this.chartCanvas) return;
    this.destroyChart();
    const s = this.snapshots;
    const labels = s.map(x => x.date.slice(8,10) + '/' + x.date.slice(5,7));

    const targetFn = this.buildTargetFunction();
    const actual = s.map(x => x.saldo);
    const target = s.map(x => targetFn(x.date));
    const delta = actual.map((v,i)=> Math.round((v - target[i]) * 100) / 100);

    const pointColors = actual.map(v => v >= 0 ? 'rgba(6,110,43,0.9)' : 'rgba(185,28,28,0.9)');
    const barColors = delta.map(v => v >= 0 ? 'rgba(6,110,43,0.5)' : 'rgba(185,28,28,0.5)');

    this.chart = new Chart(this.chartCanvas.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { type: 'line', label: 'Saldo reale CC', data: actual, borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,.15)', pointBackgroundColor: pointColors, lineTension: .2, yAxisID: 'y' },
          { type: 'line', label: 'Traiettoria (Saldo fine periodo)', data: target, borderColor: '#6c757d', backgroundColor: 'rgba(108,117,125,.15)', borderDash: [6,6], pointRadius: 0, yAxisID: 'y' },
          { type: 'bar', label: 'Δ vs obiettivo', data: delta, backgroundColor: barColors, yAxisID: 'y' }
        ]
      },
      options: {
        responsive: true,
        tooltips: { callbacks: { label: (tt:any) => {
          const i = tt.index; const d = delta[i]; const tgt = target[i];
          return `${tt.datasetIndex===2?'Δ vs obiettivo':'Saldo'}: ${tt.yLabel} €` + (tt.datasetIndex!==2?`  (target: ${tgt.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})} € — Δ: ${d.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})} €)`: '');
        }}},
        scales: {
          yAxes: [{ id: 'y', ticks: { callback: (v:any)=> v+" €" } }],
          xAxes: [{ gridLines: { display: false } }]
        },
        legend: { display: true }
      } as any
    });
  }
}
