import { Component } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

export interface Movimento {
  descrizione: string;
  importo: number; // entrata
  data: string;
}

@Component({
  selector: 'app-entrate',
  templateUrl: './entrate.component.html',
  styleUrls: ['./entrate.component.scss']
})
export class EntrateComponent {
  readonly STORAGE_KEY = 'entrate';
  nuova: Movimento = { descrizione: '', importo: 0, data: new Date().toISOString().slice(0,10) };
  entrate: Movimento[] = [];

  constructor(private ls: LocalStorageService) {
    this.entrate = this.ls.getItem<Movimento[]>(this.STORAGE_KEY, []);
  }

  aggiungi() {
    if (!this.nuova.descrizione || !this.nuova.importo) return;
    this.entrate = [ { ...this.nuova }, ...this.entrate ];
    this.ls.setItem(this.STORAGE_KEY, this.entrate);
    this.nuova = { descrizione: '', importo: 0, data: new Date().toISOString().slice(0,10) };
  }

  rimuovi(i: number) {
    this.entrate.splice(i, 1);
    this.entrate = [...this.entrate];
    this.ls.setItem(this.STORAGE_KEY, this.entrate);
  }

  get totale(): number {
    return this.entrate.reduce((acc, m) => acc + Number(m.importo || 0), 0);
  }
}
