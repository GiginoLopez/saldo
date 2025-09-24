
import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

interface Movimento { descrizione: string; importo: number; data: string; frequenza?: 'mensile' | 'annuale'; }

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  entrate: Movimento[] = [];
  spese: Movimento[] = [];

  importoIniziale = 0;
  importoFinale = 0; // obiettivo da raggiungere a fine anno

  // Stipendi per mese (12 valori)
  stipendi: number[] = new Array(12).fill(0);

  // Tabella precalcolata (evita getter che ricrea array a ogni change detection)
  piano: {
    meseIdx: number;
    mese: string;
    stipendio: number;
    entrateTotali: number;
    speseTotali: number;         // spese mensili + quota annuali
    quotaAnnuali: number;        // (spese annuali / 12)
    quotaRisparmio: number;      // importo da mettere da parte nel mese
    eccedenza: number;           // entrateTotali - speseTotali - quotaRisparmio
    saldoFinePeriodo: number;    // importoIniziale + quotaRisparmio * mese
  }[] = [];

  // indice del tooltip aperto nella tabella (dettaglio spese)
  tooltipIndex: number | null = null;

  constructor(private ls: LocalStorageService) {
    this.entrate = this.ls.getItem<Movimento[]>('entrate', []);
    this.spese  = this.ls.getItem<Movimento[]>('spese', []);

    this.importoIniziale = Number(this.ls.getItem<number>('importoIniziale', 0)) || 0;
    this.importoFinale   = Number(this.ls.getItem<number>('importoFinale', 0)) || 0;

    const saved = this.ls.getItem<number[]>('stipendiMensili', []);
    if (Array.isArray(saved) && saved.length === 12) {
      this.stipendi = saved.map(v => Number(v || 0));
    }
  }

  ngOnInit(): void {
    this.buildPiano();
  }

  /** Somme globali ricorrenti ogni mese (indipendenti dalla data) */
  private sommaEntrateRicorrenti(): number {
    return this.entrate.reduce((acc, e) => acc + Number(e.importo || 0), 0);
  }

  private sommaSpeseMensiliRicorrenti(): number {
    return this.spese
      .filter(s => (s.frequenza === 'mensile' || !s.frequenza))
      .reduce((acc, s) => acc + Number(s.importo || 0), 0);
  }


  private sommaSpeseAnnualiRicorrenti(): number {
    return this.spese
      .filter(s => s.frequenza === 'annuale')
      .reduce((acc, s) => acc + Number(s.importo || 0), 0);
  }

  /** Quota obiettivo da accantonare ogni mese per raggiungere importoFinale a fine anno */
  private quotaRisparmioMensile(): number {
    return (Number(this.importoFinale || 0) - Number(this.importoIniziale || 0)) / 12;
  }

  /** Ricostruisce la tabella una sola volta quando cambiano i dati */
  private buildPiano(): void {
    const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    const entrateRicorrenti = this.sommaEntrateRicorrenti();
    const speseMensili = this.sommaSpeseMensiliRicorrenti();
    const quotaAnnuali = this.sommaSpeseAnnualiRicorrenti() / 12;
    const quotaRisparmio = this.quotaRisparmioMensile();

    const out: typeof this.piano = [];
    for (let m = 1; m <= 12; m++) {
      const stipendio = Number(this.stipendi[m - 1] || 0);
      const entrateTotali = entrateRicorrenti + stipendio;
      const speseTotali = speseMensili + quotaAnnuali;
      const eccedenza = entrateTotali - speseTotali - quotaRisparmio;
      const saldoFinePeriodo = Number(this.importoIniziale || 0) + quotaRisparmio * m;
      out.push({
        meseIdx: m,
        mese: mesi[m - 1],
        stipendio,
        entrateTotali,
        speseTotali,
        quotaAnnuali,
        quotaRisparmio,
        eccedenza,
        saldoFinePeriodo
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
    // salva l'intero array stipendi (12 posizioni)
    this.ls.setItem('stipendiMensili', this.stipendi.map(v => Number(v || 0)));
    this.buildPiano();
  }

  toggleTooltip(i: number) {
    this.tooltipIndex = this.tooltipIndex === i ? null : i;
  }
}
