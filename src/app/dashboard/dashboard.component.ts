
import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

interface Movimento { descrizione: string; importo: number; data: string; frequenza?: 'mensile' | 'annuale'; }
interface PianoMensile {
  meseIdx: number;
  mese: string;
  entrate: number;
  speseTotali: number; // spese mensili + (annuali/12)
  quotaRisparmio: number;
  eccedenza: number;
  saldoFinePeriodo: number;
}
interface Entrata { descrizione: string; importo: number; data: string; tipo: 'mensile' | 'una-tantum'; }

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

  // Tabella precalcolata
  piano: PianoMensile[] = [];

  // Tooltip (dettaglio spese)
  tooltipIndex: number | null = null;

  constructor(private ls: LocalStorageService) {
    this.entrate = this.ls.getItem<Entrata[]>('entrate', []) || [];
    this.spese  = this.ls.getItem<Movimento[]>('spese', []) || [];
    this.importoIniziale = Number(this.ls.getItem<number>('importoIniziale', 0)) || 0;
    this.importoFinale   = Number(this.ls.getItem<number>('importoFinale', 0)) || 0;
  }

  ngOnInit(): void { this.buildPiano(); }

  private sumEntrateMensiliRicorrenti(): number {
    return this.entrate.filter(e => e.tipo === 'mensile' || !e.tipo).reduce((a, e) => a + Number(e.importo || 0), 0);
  }
  private sumEntrateUnaTantum(y: number, m: number): number {
    return this.entrate
      .filter(e => e.tipo === 'una-tantum' && this.sameMonthYear(e.data, y, m))
      .reduce((a, e) => a + Number(e.importo || 0), 0);
  }

  private sumSpeseMensili(): number {
    return this.spese
      .filter(s => (s.frequenza === 'mensile' || !s.frequenza))
      .reduce((a, s) => a + Number(s.importo || 0), 0);
  }
  private sumSpeseAnnuali(): number {
    return this.spese.filter(s => s.frequenza === 'annuale').reduce((a, s) => a + Number(s.importo || 0), 0);
  }

  private sameMonthYear(dateIso: string, y: number, m: number): boolean {
    const d = new Date(dateIso);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
  }

  private quotaRisparmioMensile(): number {
    return (Number(this.importoFinale || 0) - Number(this.importoIniziale || 0)) / 12;
  }

  private buildPiano() {
    const y = new Date().getFullYear();
    const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    const entrateRicorrenti = this.sumEntrateMensiliRicorrenti();
    const speseMensili = this.sumSpeseMensili();
    const quotaAnnuali = this.sumSpeseAnnuali() / 12;
    const quotaRisparmio = this.quotaRisparmioMensile();

    const out: PianoMensile[] = [];
    for (let m = 1; m <= 12; m++) {
      const entrateM = entrateRicorrenti + this.sumEntrateUnaTantum(y, m);
      const speseTotali = speseMensili + quotaAnnuali;
      const eccedenza = entrateM - speseTotali - quotaRisparmio;
      const saldoFinePeriodo = Number(this.importoIniziale || 0) + quotaRisparmio * m;
      out.push({ meseIdx: m, mese: mesi[m - 1], entrate: entrateM, speseTotali, quotaRisparmio, eccedenza, saldoFinePeriodo });
    }
    this.piano = out;
  }

  // --- Dettaglio tooltip spese ---
  get dettaglioSpeseMensili() {
    return this.spese
      .filter(s => (s.frequenza === 'mensile' || !s.frequenza))
      .map(s => ({ descrizione: s.descrizione, importo: Number(s.importo || 0) }));
  }
  get dettaglioSpeseAnnuali() {
    return this.spese
      .filter(s => s.frequenza === 'annuale')
      .map(s => ({ descrizione: s.descrizione, importoAnnuale: Number(s.importo || 0), importoMensile: Number(s.importo || 0) / 12 }));
  }
  toggleTooltip(i: number) { this.tooltipIndex = this.tooltipIndex === i ? null : i; }
}
