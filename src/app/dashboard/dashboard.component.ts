
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

  // Stipendi per mese (12 valori) — persiste in localStorage
  stipendi: number[] = new Array(12).fill(0);

  // Totali spese per tooltip
  totaleSpeseMensili = 0;            // somma spese con frequenza mensile (o assente)
  quotaSpeseAnnualiMensile = 0;      // (somma spese annuali) / 12

  // Tabella precalcolata (evita ricalcoli continui)
  piano: PianoMensile[] = [];

  tooltipIndex: number | null = null;

  constructor(private ls: LocalStorageService) {
    this.entrate = (this.ls.getItem<Entrata[]>('entrate', []) || []).map(e => ({
      descrizione: String(e.descrizione || ''),
      importo: Number(e.importo || 0),
      data: e.data ? String(e.data) : new Date().toISOString().slice(0,10),
      tipo: (e as any).tipo === 'una-tantum' ? 'una-tantum' : 'mensile' // default mensile
    }));
    this.spese  = this.ls.getItem<Movimento[]>('spese', []) || [];

    this.importoIniziale = Number(this.ls.getItem<number>('importoIniziale', 0)) || 0;
    this.importoFinale   = Number(this.ls.getItem<number>('importoFinale', 0)) || 0;

    const savedStip = this.ls.getItem<number[]>('stipendiMensili', []);
    if (Array.isArray(savedStip) && savedStip.length === 12) {
      this.stipendi = savedStip.map(v => Number(v || 0));
    }
  }

  ngOnInit(): void { this.buildPiano(); }

  private sameMonthYear(dateIso: string, y: number, m: number): boolean {
    const d = new Date(dateIso);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  }

  private quotaRisparmioMensile(): number {
    return (Number(this.importoFinale || 0) - Number(this.importoIniziale || 0)) / 12;
  }

  private buildPiano(): void {
    const y = new Date().getFullYear();
    const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    const entrateRicorrenti = this.entrate
      .filter(e => e.tipo !== 'una-tantum')
      .reduce((a, e) => a + Number(e.importo || 0), 0);

    // Spese: mensili + annuali/12 (totali fissi per mese)
    this.totaleSpeseMensili = this.spese
      .filter(s => (s.frequenza === 'mensile' || !s.frequenza))
      .reduce((a, s) => a + Number(s.importo || 0), 0);

    const sommaAnnuali = this.spese
      .filter(s => s.frequenza === 'annuale')
      .reduce((a, s) => a + Number(s.importo || 0), 0);

    this.quotaSpeseAnnualiMensile = sommaAnnuali / 12;

    const quotaRisparmio = this.quotaRisparmioMensile();

    const out: PianoMensile[] = [];
    for (let m = 1; m <= 12; m++) {
      const stipendio = Number(this.stipendi[m - 1] || 0);
      const unaTantumM = this.entrate
        .filter(e => e.tipo === 'una-tantum' && this.sameMonthYear(e.data, y, m))
        .reduce((a, e) => a + Number(e.importo || 0), 0);

      const entrate = entrateRicorrenti + stipendio + unaTantumM;
      const speseTotali = this.totaleSpeseMensili + this.quotaSpeseAnnualiMensile;
      const eccedenza = entrate - speseTotali - quotaRisparmio;
      const saldoFinePeriodo = Number(this.importoIniziale || 0) + quotaRisparmio * m;
      out.push({
        meseIdx: m, mese: mesi[m - 1], stipendio, entrate, speseTotali, quotaRisparmio, eccedenza, saldoFinePeriodo
      });
    }
    this.piano = out;
  }

  salvaObiettivi() {
    this.ls.setItem('importoIniziale', Number(this.importoIniziale || 0));
    this.ls.setItem('importoFinale', Number(this.importoFinale || 0));
    this.buildPiano();
  }

  onStipendioChange() {
    this.ls.setItem('stipendiMensili', this.stipendi.map(v => Number(v || 0)));
    this.buildPiano();
  }

  toggleTooltip(i: number) { this.tooltipIndex = this.tooltipIndex === i ? null : i; }
}
