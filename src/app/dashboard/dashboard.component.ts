
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

  get totaleEntrate(): number {
    return this.entrate.reduce((a, b) => a + Number(b.importo || 0), 0);
  }
  get totaleSpese(): number {
    return this.spese.reduce((a, b) => a + Number(b.importo || 0), 0);
  }
  get saldo(): number {
    return this.totaleEntrate - this.totaleSpese;
  }

  get year(): number { return new Date().getFullYear(); }

  private sameMonthYear(dateIso: string, y: number, m: number): boolean {
    const d = new Date(dateIso);
    return d.getFullYear() === y && (d.getMonth() + 1) === m;
    }

  private sumEntrate(y: number, m: number): number {
    return this.entrate
      .filter(e => this.sameMonthYear(e.data, y, m))
      .reduce((acc, e) => acc + Number(e.importo || 0), 0);
  }

  private sumSpeseMensili(y: number, m: number): number {
    return this.spese
      .filter(s => (s.frequenza === 'mensile' || !s.frequenza) && this.sameMonthYear(s.data, y, m))
      .reduce((acc, s) => acc + Number(s.importo || 0), 0);
  }

  private sumSpeseAnnualiAnno(y: number): number {
    return this.spese
      .filter(s => s.frequenza === 'annuale' && new Date(s.data).getFullYear() === y)
      .reduce((acc, s) => acc + Number(s.importo || 0), 0);
  }

  get deltaMensileTarget(): number {
    return (Number(this.importoFinale || 0) - Number(this.importoIniziale || 0)) / 12;
  }

  get pianoMensile(): { meseIdx: number; mese: string; targetFineMese: number; diffMensile: number }[] {
    const y = this.year;
    const quotaAnnuali = this.sumSpeseAnnualiAnno(y) / 12;
    const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const out = [] as { meseIdx: number; mese: string; targetFineMese: number; diffMensile: number }[];

    for (let m = 1; m <= 12; m++) {
      const entrateM = this.sumEntrate(y, m);
      const speseMensiliM = this.sumSpeseMensili(y, m);
      const diffMensile = entrateM - speseMensiliM - quotaAnnuali;
      const targetFineMese = Number(this.importoIniziale || 0) + this.deltaMensileTarget * m;
      out.push({ meseIdx: m, mese: mesi[m - 1], targetFineMese, diffMensile });
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
