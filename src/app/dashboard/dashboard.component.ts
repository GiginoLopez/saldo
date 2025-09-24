
import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

interface Movimento { descrizione: string; importo: number; data: string; frequenza?: 'mensile' | 'annuale'; }
interface Entrata { descrizione: string; importo: number; data: string; tipo?: 'mensile' | 'una-tantum'; }
interface PianoMensile {
  meseIdx: number;
  mese: string;
  stipendio: number;
  entrate: number;
  speseTotali: number;
  quotaRisparmio: number;
  eccedenza: number;
  saldoFinePeriodo: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  entrate: Entrata[] = [];
  spese: Movimento[] = [];

  importoIniziale = 0;
  importoFinale = 0;

  // Stipendi per 13 periodi (Gen..Nov, 13ª, Dic)
  stipendi: number[] = new Array(13).fill(0);

  // Totali spese per tooltip
  totaleSpeseMensili = 0;            // somma spese con frequenza mensile (o assente)
  quotaSpeseAnnualiMensile = 0;      // (somma spese annuali) / 13

  // Tabella precalcolata
  piano: PianoMensile[] = [];

  // Dati grafico (Entrate vs Spese per periodo, 13 colonne)
  chartData: { label: string; entrate: number; spese: number; hE: number; hS: number }[] = [];
  chartMax = 0;

  tooltipIndex: number | null = null;

  constructor(private ls: LocalStorageService) {
    // Carica dati base
    this.entrate = (this.ls.getItem<Entrata[]>('entrate', []) || []).map(e => ({
      descrizione: String(e.descrizione || ''),
      importo: Number(e.importo || 0),
      data: e.data ? String(e.data) : new Date().toISOString().slice(0,10),
      tipo: (e as any).tipo === 'una-tantum' ? 'una-tantum' : 'mensile'
    }));
    this.spese  = this.ls.getItem<Movimento[]>('spese', []) || [];

    this.importoIniziale = Number(this.ls.getItem<number>('importoIniziale', 0)) || 0;
    this.importoFinale   = Number(this.ls.getItem<number>('importoFinale', 0)) || 0;

    // Migrazione stipendi: da 12 a 13 elementi
    const savedStip = this.ls.getItem<number[]>('stipendiMensili', []);
    if (Array.isArray(savedStip)) {
      const arr = savedStip.map(v => Number(v || 0));
      if (arr.length < 13) {
        while (arr.length < 13) arr.push(0);
      } else if (arr.length > 13) {
        arr.length = 13;
      }
      this.stipendi = arr;
    }
  }

  ngOnInit(): void { this.buildPiano(); }

  private sameMonthYear(dateIso: string, y: number, m: number): boolean {
    const d = new Date(dateIso);
    return d.getFullYear() === y && (d.getMonth() + 1) === m; // m in 1..12 ONLY
  }

  private quotaRisparmioMensile(): number {
    // Ripartizione su 13 periodi per raggiungere l'obiettivo sulla 13ª
    return (Number(this.importoFinale || 0) - Number(this.importoIniziale || 0)) / 13;
  }

  private buildPiano(): void {
    const y = new Date().getFullYear();
    // 13 etichette: inseriamo "13ª" prima di Dicembre
    const mesi = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','13ª','Dic'];

    const entrateRicorrenti = this.entrate
      .filter(e => e.tipo !== 'una-tantum')
      .reduce((a, e) => a + Number(e.importo || 0), 0);

    // Spese: mensili applicate a 12 mesi (NON sulla 13ª); annuali ripartite su 13
    this.totaleSpeseMensili = this.spese
      .filter(s => (s.frequenza === 'mensile' || !s.frequenza))
      .reduce((a, s) => a + Number(s.importo || 0), 0);

    const sommaAnnuali = this.spese
      .filter(s => s.frequenza === 'annuale')
      .reduce((a, s) => a + Number(s.importo || 0), 0);
    this.quotaSpeseAnnualiMensile = sommaAnnuali / 13;

    const quotaRisparmio = this.quotaRisparmioMensile();

    const out: PianoMensile[] = [];
    for (let m = 1; m <= 13; m++) {
      const stipendio = Number(this.stipendi[m - 1] || 0);

      // Entrate una tantum: solo per mesi 1..12 (non esiste mese 13)
      const unaTantumM = (m <= 12)
        ? this.entrate.filter(e => e.tipo === 'una-tantum' && this.sameMonthYear(e.data, y, m))
                      .reduce((a, e) => a + Number(e.importo || 0), 0)
        : 0;

      const entrate = entrateRicorrenti + stipendio + unaTantumM;

      // FIX: spese mensili su tutti i mesi tranne la 13ª (m==12) + annuali/13 sempre
      const speseMensiliPeriodo = (m === 12 ? 0 : this.totaleSpeseMensili);
      const speseTotali = speseMensiliPeriodo + this.quotaSpeseAnnualiMensile;

      const eccedenza = entrate - speseTotali - quotaRisparmio;
      const saldoFinePeriodo = Number(this.importoIniziale || 0) + quotaRisparmio * m; // 13 quote

      out.push({ meseIdx: m, mese: mesi[m - 1], stipendio, entrate, speseTotali, quotaRisparmio, eccedenza, saldoFinePeriodo });
    }
    this.piano = out;
    this.buildChart();
  }

  private buildChart(): void {
    const max = Math.max(1, ...this.piano.map(p => Math.max(p.entrate, p.speseTotali)));
    this.chartMax = max;
    this.chartData = this.piano.map(p => ({
      label: p.mese,
      entrate: p.entrate,
      spese: p.speseTotali,
      hE: Math.round((p.entrate / max) * 100),
      hS: Math.round((p.speseTotali / max) * 100)
    }));
  }

  salvaObiettivi() {
    this.ls.setItem('importoIniziale', Number(this.importoIniziale || 0));
    this.ls.setItem('importoFinale', Number(this.importoFinale || 0));
    this.buildPiano();
  }

  onStipendioChange() {
    // Persistiamo sempre 13 valori
    const toSave = this.stipendi.slice(0, 13).map(v => Number(v || 0));
    while (toSave.length < 13) toSave.push(0);
    this.ls.setItem('stipendiMensili', toSave);
    this.buildPiano();
  }

  toggleTooltip(i: number) { this.tooltipIndex = this.tooltipIndex === i ? null : i; }
}
