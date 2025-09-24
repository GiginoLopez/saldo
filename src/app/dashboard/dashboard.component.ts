
import { Component } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

interface Movimento { descrizione: string; importo: number; data: string; }

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  entrate: Movimento[] = [];
  spese: Movimento[] = [];

  constructor(private ls: LocalStorageService) {
    this.entrate = this.ls.getItem<Movimento[]>('entrate', []);
    this.spese  = this.ls.getItem<Movimento[]>('spese', []);
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

  exportCSV() {
    // Funzione di escape per CSV (RFC4180-like)
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
