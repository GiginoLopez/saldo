import { Component } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

export interface Movimento {
  descrizione: string;
  importo: number; // spesa
  data: string;    // ISO yyyy-MM-dd
}

@Component({
  selector: 'app-spese',
  templateUrl: './spese.component.html',
  styleUrls: ['./spese.component.scss']
})
export class SpeseComponent {
  readonly STORAGE_KEY = 'spese';
  nuova: Movimento = { descrizione: '', importo: 0, data: new Date().toISOString().slice(0,10) };
  spese: Movimento[] = [];

  constructor(private ls: LocalStorageService) {
    this.spese = this.ls.getItem<Movimento[]>(this.STORAGE_KEY, []);
  }

  aggiungi() {
    if (!this.nuova.descrizione || !this.nuova.importo) return;
    this.spese = [ { ...this.nuova }, ...this.spese ];
    this.ls.setItem(this.STORAGE_KEY, this.spese);
    this.nuova = { descrizione: '', importo: 0, data: new Date().toISOString().slice(0,10) };
  }

  rimuovi(i: number) {
    this.spese.splice(i, 1);
    this.spese = [...this.spese];
    this.ls.setItem(this.STORAGE_KEY, this.spese);
  }

  get totale(): number {
    return this.spese.reduce((acc, m) => acc + Number(m.importo || 0), 0);
  }
}
