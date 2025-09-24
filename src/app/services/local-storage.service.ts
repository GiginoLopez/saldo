import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private hasLocalStorage = typeof window !== 'undefined' && !!window.localStorage;

  getItem<T>(key: string, fallback: T): T {
    if (!this.hasLocalStorage) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  setItem<T>(key: string, value: T): void {
    if (!this.hasLocalStorage) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    if (!this.hasLocalStorage) return;
    localStorage.removeItem(key);
  }
}
