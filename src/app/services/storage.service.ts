import { Injectable } from '@angular/core';
import { AppState, Year, YearData } from '../models';

const STORAGE_KEY = 'conti-forecast-state';
const CURRENT_VERSION = 2; // bumped for ccSnapshots

@Injectable({ providedIn: 'root' })
export class StorageService {
  load(): AppState {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return this.initialState();
    try { return this.migrate(JSON.parse(raw) as AppState); } catch { return this.initialState(); }
  }
  save(state: AppState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  private initialState(): AppState {
    const year = new Date().getFullYear();
    return {
      version: CURRENT_VERSION,
      years: [year],
      dataByYear: {
        [year]: {
          config: { year, saldoInizialeCC: 0, saldoFinaleDesideratoCC: 0 },
          monthlyExpenses: [],
          annualExpenses: [],
          monthlyIncomes: [],
          oneOffIncomes: [],
          prepaidSnapshots: [],
          ccSnapshots: []
        }
      }
    };
  }

  private migrate(state: AppState): AppState {
    if (!state.version || state.version < 1) state.version = 1;
    // ensure data structure for every year
    for (const y of state.years) {
      const cur = state.dataByYear[y] as any;
      if (!cur.prepaidSnapshots) cur.prepaidSnapshots = [];
      if (!cur.ccSnapshots) cur.ccSnapshots = [];
      if (!cur.config) cur.config = { year: y, saldoInizialeCC: 0, saldoFinaleDesideratoCC: 0 };
    }
    state.version = CURRENT_VERSION;
    return state;
  }

  upsertYear(year: Year, data?: Partial<YearData>) {
    const s = this.load();
    if (!s.years.includes(year)) s.years.push(year);
    const current: YearData = s.dataByYear[year] ?? {
      config: { year, saldoInizialeCC: 0, saldoFinaleDesideratoCC: 0 },
      monthlyExpenses: [],
      annualExpenses: [],
      monthlyIncomes: [],
      oneOffIncomes: [],
      prepaidSnapshots: [],
      ccSnapshots: []
    } as YearData;
    s.dataByYear[year] = {
      ...current,
      ...data,
      config: { ...current.config, ...(data?.config ?? {}) },
      ccSnapshots: data?.ccSnapshots ?? current.ccSnapshots
    } as YearData;
    this.save(s);
  }

  getYearData(year: Year): YearData { return this.load().dataByYear[year]; }
}
