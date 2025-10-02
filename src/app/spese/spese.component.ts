
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

  // Stato ordinamento (indipendente per tabella Mensili/Annuali)
  sortKeyMens: 'data' | 'descrizione' | 'importo' = 'data';
  sortDirMens: 1 | -1 = 1;
  sortKeyAnn: 'data' | 'descrizione' | 'importo' = 'data';
  sortDirAnn: 1 | -1 = 1;

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

  // Persistenza su blur dell'importo
  onImportoBlur(i: number) {
    this.spese[i].importo = Number(this.spese[i].importo || 0);
    this.spese = [...this.spese];
    this.ls.setItem(this.STORAGE_KEY, this.spese);
  }

  // Getter totali
  get totaleMensili(): number {
    return this.spese.filter(s => s.frequenza === 'mensile').reduce((a, b) => a + Number(b.importo || 0), 0);
  }

  get totaleAnnuali(): number {
    return this.spese.filter(s => s.frequenza === 'annuale').reduce((a, b) => a + Number(b.importo || 0), 0);
  }

  // NUOVA LOGICA: totale = mensili + (annuali / 13)
  get totale(): number {
    return this.totaleMensili + (this.totaleAnnuali / 13);
  }

  // Getter liste ordinate
  get speseMensiliSorted(): Movimento[] {
    const list = this.spese.filter(s => s.frequenza === 'mensile').slice();
    return list.sort((a, b) => this.compare(a, b, this.sortKeyMens) * this.sortDirMens);
  }

  get speseAnnualiSorted(): Movimento[] {
    const list = this.spese.filter(s => s.frequenza === 'annuale').slice();
    return list.sort((a, b) => this.compare(a, b, this.sortKeyAnn) * this.sortDirAnn);
  }

  // Toggle ordinamento
  sortMens(key: 'data' | 'descrizione' | 'importo') {
    if (this.sortKeyMens === key) {
      this.sortDirMens = (this.sortDirMens === 1 ? -1 : 1);
    } else {
      this.sortKeyMens = key;
      this.sortDirMens = 1;
    }
  }

  sortAnn(key: 'data' | 'descrizione' | 'importo') {
    if (this.sortKeyAnn === key) {
      this.sortDirAnn = (this.sortDirAnn === 1 ? -1 : 1);
    } else {
      this.sortKeyAnn = key;
      this.sortDirAnn = 1;
    }
  }

  // Comparatore
  private compare(a: Movimento, b: Movimento, key: 'data' | 'descrizione' | 'importo'): number {
    if (key === 'importo') {
      return Number(a.importo || 0) - Number(b.importo || 0);
    }
    if (key === 'data') {
      // confronto lessicografico su yyyy-MM-dd è già ordine cronologico
      return String(a.data || '').localeCompare(String(b.data || ''));
    }
    // descrizione
    return String(a.descrizione || '').localeCompare(String(b.descrizione || ''), 'it', { sensitivity: 'base' });
  }
}
