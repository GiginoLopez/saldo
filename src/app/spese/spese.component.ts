import { Component } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

export interface Movimento {
  descrizione: string;
  importo: number; // spesa
  data: string;    // ISO yyyy-MM-dd
  frequenza: 'mensile' | 'annuale';
}

@Component({
  selector: 'app-spese',
  templateUrl: './spese.component.html',
  styleUrls: ['./spese.component.scss']
})
export class SpeseComponent {
  readonly STORAGE_KEY = 'spese';
  nuova: Movimento = { descrizione: '', importo: 0, data: new Date().toISOString().slice(0,10), frequenza: 'mensile' };
  spese: Movimento[] = [];

  constructor(private ls: LocalStorageService) {
    // Migrazione retro-compatibile: se mancano 'frequenza', default 'mensile'
    const loaded = this.ls.getItem<Partial<Movimento>[]>(this.STORAGE_KEY, []);
    this.spese = loaded.map(s => ({
      descrizione: String(s.descrizione || ''),
      importo: Number((s as any).importo || 0),
      data: s.data ? String(s.data) : new Date().toISOString().slice(0,10),
      frequenza: (s as any).frequenza === 'annuale' ? 'annuale' : 'mensile'
    }));
  }

  aggiungi() {
    if (!this.nuova.descrizione || !this.nuova.importo) return;
    this.spese = [ { ...this.nuova }, ...this.spese ];
    this.ls.setItem(this.STORAGE_KEY, this.spese);
    this.nuova = { descrizione: '', importo: 0, data: new Date().toISOString().slice(0,10), frequenza: 'mensile' };
  }

  rimuovi(i: number) {
    this.spese.splice(i, 1);
    this.spese = [...this.spese];
    this.ls.setItem(this.STORAGE_KEY, this.spese);
  }

  get totale(): number {
    return this.spese.reduce((acc, m) => acc + Number(m.importo || 0), 0);
  }

  get totaleMensili(): number {
    return this.spese.filter(s => s.frequenza === 'mensile').reduce((a, b) => a + Number(b.importo || 0), 0);
  }

  get totaleAnnuali(): number {
    return this.spese.filter(s => s.frequenza === 'annuale').reduce((a, b) => a + Number(b.importo || 0), 0);
  }
}
