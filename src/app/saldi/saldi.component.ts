import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Chart } from 'chart.js';
import { StorageService } from '../services/storage.service';
import { LocalStorageService } from '../services/local-storage.service';
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

  // --- editing state ---
  editingId: string | null = null;
  editModel: { date: string; saldo: number; note: string } = { date: '', saldo: 0, note: '' };

  constructor(
    private fb: FormBuilder,
    private storage: StorageService,
    private ls: LocalStorageService
  ) {}

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

  startEdit(s: CcSnapshot) {
    this.editingId = s.id;
    this.editModel = { date: s.date, saldo: s.saldo, note: s.note || '' };
  }

  cancelEdit() {
    this.editingId = null;
  }

  saveEdit() {
    if (!this.data || !this.editingId) return;
    const idx = this.data.ccSnapshots.findIndex(x => x.id === this.editingId);
    if (idx >= 0) {
      const m = this.editModel;
      this.data.ccSnapshots[idx] = { ...this.data.ccSnapshots[idx], date: m.date, saldo: Number(m.saldo||0), note: m.note||'' };
      this.persist();
      this.sortSnapshots();
      this.renderChart();
    }
    this.editingId = null;
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

  private buildTarget13(): { labels: string[]; tAnchors: number[]; target: number[] } {
    const s0 = Number(this.ls.getItem('importoIniziale', 0) || 0);
    const sF = Number(this.ls.getItem('importoFinale', 0) || 0);
    const quota = (sF - s0) / 13;

    const labels = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','13ª','Dic'];
    const year = this.currentYear;

    const tAnchors: number[] = [];
    for (let m = 1; m <= 11; m++) {
      const lastDay = new Date(year, m, 0);
      tAnchors.push(lastDay.getTime());
    }
    tAnchors.push(new Date(year, 11, 15).getTime()); // 13ª
    tAnchors.push(new Date(year, 11, 31).getTime()); // Dic

    const target = Array.from({length: 13}, (_,i)=> s0 + quota * (i+1));
    return { labels, tAnchors, target };
  }

  private buildReal13(tAnchors: number[]): number[] {
    const snaps = this.snapshots.slice().sort((a,b)=>a.date.localeCompare(b.date));
    if (snaps.length === 0) return new Array(13).fill(0);

    const firstT = new Date(snaps[0].date).getTime();
    const lastT = new Date(snaps[snaps.length-1].date).getTime();

    const findLastLE = (t: number): number | null => {
      let val: number | null = null;
      for (const s of snaps) {
        const ts = new Date(s.date).getTime();
        if (ts <= t) val = s.saldo; else break;
      }
      return val;
    };

    return tAnchors.map(t => {
      if (t < firstT) return 0;
      if (t > lastT) return snaps[snaps.length-1].saldo;
      const le = findLastLE(t);
      return le == null ? 0 : le;
    });
  }

  private renderChart() {
    if (!this.chartCanvas) return;
    this.destroyChart();

    const { labels, tAnchors, target } = this.buildTarget13();
    const real = this.buildReal13(tAnchors);

    const pointColors = real.map(v => v >= 0 ? 'rgba(6,110,43,0.9)' : 'rgba(185,28,28,0.9)');

    this.chart = new Chart(this.chartCanvas.nativeElement.getContext('2d')!, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            type: 'line', label: 'Saldo reale CC', data: real,
            borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,.15)',
            pointBackgroundColor: pointColors, lineTension: .2, yAxisID: 'y'
          },
          {
            type: 'line', label: 'Saldo fine periodo (Dashboard)', data: target,
            borderColor: '#6c757d', backgroundColor: 'rgba(108,117,125,.15)',
            borderDash: [6,6], pointRadius: 3, yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        tooltips: { callbacks: { label: (tt:any) => `${tt.datasetLabel}: ${tt.yLabel} €` } },
        scales: {
          yAxes: [{ id: 'y', ticks: { beginAtZero: true, suggestedMin: 0, callback: (v:any)=> v+" €" } }],
          xAxes: [{ gridLines: { display: false } }]
        },
        legend: { display: true }
      } as any
    });
  }
}
