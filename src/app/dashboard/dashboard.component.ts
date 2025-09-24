
import { Component } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

interface Movimento { descrizione: string; importo: number; data: string; frequenza?: 'mensile' | 'annuale'; }

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  entrate: Movimento[] = [];
  spese: Movimento[] = [];

  importoIniziale = 0;
  importoFinale = 0; // obiettivo da raggiungere a fine anno

  constructor(private ls: LocalStorageService) {
    this.entrate = this.ls.getItem<Movimento[]>('entrate', []);
    this.spese  = this.ls.getItem<Movimento[]>('spese', []);

    this.importoIniziale = Number(this.ls.getItem<number>('importoIniziale', 0));
    this.importoFinale   = Number(this.ls.getItem<number>('importoFinale', 0));
  }

  /** Somme globali indipendenti dalla data (applicate ogni mese) */
  get sommaEntrateMensileRicorrente(): number {
    return this.entrate.reduce((acc, e) => acc + Number(e.importo || 0), 0);
  }

  get sommaSpeseMensiliRicorrenti(): number {
    return this.spese
      .filter(s => (s.frequenza === 'mensile' || !s.frequenza))
      .reduce((acc, s) => acc + Number(s.importo || 0), 0);
  }

  get sommaSpeseAnnualiRicorrenti(): number {
    return this.spese
      .filter(s => s.frequenza === 'annuale')
      .reduce((acc, s) => acc + Number(s.importo || 0), 0);
  }

  /** Quota obiettivo da accantonare ogni mese per raggiungere importoFinale a fine anno */
  get quotaRisparmioMensile(): number {
    return (Number(this.importoFinale || 0) - Number(this.importoIniziale || 0)) / 12;
  }

  /** Piano dettagliato mese per mese (tutti i movimenti considerati ricorrenti mensilmente) */
  get pianoMensile(): {
    meseIdx: number;
    mese: string;
    entrate: number;
    speseMensili: number;
    quotaAnnuali: number;        // (spese annuali / 12)
    quotaRisparmio: number;      // importo da mettere da parte nel mese
    eccedenza: number;           // entrate - speseMensili - quotaAnnuali - quotaRisparmio
    saldoFinePeriodo: number;    // importoIniziale + quotaRisparmio * mese
  }[] {
    const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    const entrateM = this.sommaEntrateMensileRicorrente;
    const speseMensiliM = this.sommaSpeseMensiliRicorrenti;
    const quotaAnnuali = this.sommaSpeseAnnualiRicorrenti / 12;
    const quotaRisparmio = this.quotaRisparmioMensile;

    const out: any[] = [];
    for (let m = 1; m <= 12; m++) {
      const eccedenza = entrateM - speseMensiliM - quotaAnnuali - quotaRisparmio;
      const saldoFinePeriodo = Number(this.importoIniziale || 0) + quotaRisparmio * m;
      out.push({
        meseIdx: m,
        mese: mesi[m - 1],
        entrate: entrateM,
        speseMensili: speseMensiliM,
        quotaAnnuali: quotaAnnuali,
        quotaRisparmio: quotaRisparmio,
        eccedenza: eccedenza,
        saldoFinePeriodo: saldoFinePeriodo
      });
    }
    return out;
  }

  salvaObiettivi() {
    this.ls.setItem('importoIniziale', Number(this.importoIniziale || 0));
    this.ls.setItem('importoFinale', Number(this.importoFinale || 0));
  }

  exportCSV() {
    const escapeCSV = (val: any): string => {
      const s = String(val == null ? '' : val);
      const needsQuotes = s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('') >= 0 || s.indexOf('') >= 0;
      const esc = s.replace(/"/g, '""');
      return needsQuotes ? '"' + esc + '"' : esc;
    };

    const header = ['tipo', 'data', 'descrizione', 'importo'];
    const rows: string[][] = [header]
      .concat(this.entrate.map(e => ['entrata', e.data, e.descrizione, String(e.importo)]))
      .concat(this.spese.map(s => ['spesa', s.data, s.descrizione, String(s.importo)]));

    const csv = rows.map(r => r.map(escapeCSV).join(',')).join('');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movimenti.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  azzeraDati() {
    if (!confirm('Sei sicuro di voler eliminare TUTTI i dati di entrate e spese?')) return;
    this.ls.remove('entrate');
    this.ls.remove('spese');
    this.entrate = [];
    this.spese = [];
  }
}
