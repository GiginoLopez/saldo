
# Conti • Previsionale (Angular 9 + Bootstrap) — Fix build watcher & CSV typing

Differenze vs pacchetto precedente:
- **Script start di default senza polling** (`ng serve`) per evitare gli errori EBUSY di Chokidar su `C:\`.
- Aggiunto script `start:poll` opzionale se servi da network drive.
- **Fix TypeScript** nell'export CSV: conversione numeri→stringhe e uso di `[header, ...rows]`.

## Avvio
```bash
npm install
npm start          # usa watcher nativo (consigliato)
# oppure, solo se necessario su dischi di rete o VM:
npm run start:poll # usa CHOKIDAR con polling
```
