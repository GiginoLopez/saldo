import { Component } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

export interface Entrata {
  descrizione: string;
  importo: number;
  data: string; // ISO yyyy-MM-dd
  tipo: 'mensile' | 'una-tantum';
}

@Component({
  selector: 'app-entrate',
  templateUrl: './entrate.component.html',
  styleUrls: ['./entrate.component.scss']
})
export class EntrateComponent {
  readonly STORAGE_KEY = 'entrate';
  nuova: Entrata = { descrizione: '', importo: 0, data: new Date().toISOString().slice(0,10), tipo: 'mensile' };
  entrate: Entrata[] = [];

  constructor(private ls: LocalStorageService) {
    // Migrazione: se manca 'tipo' -> 'mensile'
    const loaded = this.ls.getItem<any[]>(this.STORAGE_KEY, []);
    this.entrate = (loaded || []).map(e => ({
      descrizione: String(e.descrizione || ''),
      importo: Number(e.importo || 0),
      data: e.data ? String(e.data) : new Date().toISOString().slice(0,10),
      tipo: (e.tipo === 'una-tantum' || e.tipo === 'mensile') ? e.tipo : 'mensile'
    }));
  }

  aggiungi() {
    if (!this.nuova.descrizione || !this.nuova.importo) return;
    this.entrate = [{ ...this.nuova }, ...this.entrate];
    this.persist();
    this.nuova = { descrizione: '', importo: 0, data: new Date().toISOString().slice(0,10), tipo: 'mensile' };
  }

  rimuovi(i: number) {
    this.entrate.splice(i, 1);
    this.entrate = [...this.entrate];
    this.persist();
  }

  // ⬇️ Aggiunta minima: persistenza su blur dell'importo
  onImportoBlur(i: number) {
    // Normalizza a numero e crea nuova reference per triggerare change detection
    this.entrate[i].importo = Number(this.entrate[i].importo || 0);
    this.entrate = [...this.entrate];
    this.persist();
  }

  private persist() {
    this.ls.setItem(this.STORAGE_KEY, this.entrate);
  }

  get totale(): number {
    return this.entrate.reduce((acc, e) => acc + Number(e.importo || 0), 0);
  }
}