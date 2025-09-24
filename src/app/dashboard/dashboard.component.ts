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

  get progresso(): number {
    // quanto hai oggi: importo iniziale + saldo corrente
    return Number(this.importoIniziale || 0) + this.saldo;
  }

  get mancante(): number {
    const diff = Number(this.importoFinale || 0) - this.progresso;
    return diff > 0 ? diff : 0;
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
