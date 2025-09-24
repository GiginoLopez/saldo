
import { Injectable } from '@angular/core';
import { ForecastMonth, ForecastResult, YearData } from '../models';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  computeForecast(data: YearData): ForecastResult {
    const { config } = data; const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const fixedMonthlyIncome = sum(data.monthlyIncomes.map(x => x.importo));
    const stipendioMensile = sum(data.monthlyIncomes.filter(x => x.type === 'stipendio').map(x => x.importo));
    const fixedMonthlyExpenses = sum(data.monthlyExpenses.filter(e => e.active).map(x => x.importo));

    const annualExpenseByMonth = aggregateByMonth(data.annualExpenses);
    const oneOffIncomeByMonth = aggregateByMonth(data.oneOffIncomes);

    const entrateTotali = fixedMonthlyIncome * 12 + sum(Object.values(oneOffIncomeByMonth).map(v => sum(v)));
    const usciteTotali = fixedMonthlyExpenses * 12 + sum(Object.values(annualExpenseByMonth).map(v => sum(v)));

    const Ttot = config.saldoInizialeCC + entrateTotali - usciteTotali - config.saldoFinaleDesideratoCC;

    const marginiGrezzi: number[] = []; const entratePerMese: number[] = []; const uscitePerMese: number[] = []; const stipendioPerMese: number[] = [];
    let saldoAttuale = config.saldoInizialeCC;
    for (const m of months) {
      const entrateMese = fixedMonthlyIncome + sum(oneOffIncomeByMonth[m] || []);
      const stipendioMese = stipendioMensile;
      const usciteMese = fixedMonthlyExpenses + sum(annualExpenseByMonth[m] || []);
      const margine = saldoAttuale + entrateMese - usciteMese;
      marginiGrezzi.push(margine); entratePerMese.push(entrateMese); uscitePerMese.push(usciteMese); stipendioPerMese.push(stipendioMese);
      saldoAttuale = margine;
    }

    let bonifici = new Array(12).fill(0); let messaggio: string | undefined; let fattibile = true;

    if (Ttot <= 0) {
      messaggio = Ttot < 0
        ? `Attenzione: per raggiungere il saldo finale desiderato mancano ${fmt(-Ttot)} €. I bonifici sono stati azzerati.`
        : `Nessun importo trasferibile verso la carta prepagata per raggiungere il saldo finale desiderato.`;
      bonifici = new Array(12).fill(0); fattibile = Ttot === 0;
    } else {
      const positiveIndices = marginiGrezzi.map((mg, idx) => ({ mg, idx })).filter(x => x.mg > 0).map(x => x.idx);
      const sumPositiveMargins = sum(positiveIndices.map(i => marginiGrezzi[i]));
      if (sumPositiveMargins <= 0) { messaggio = `Impossibile distribuire ${fmt(Ttot)} € perché nessun mese ha margine positivo.`; fattibile = false; }
      else {
        let remaining = Math.min(Ttot, sumPositiveMargins);
        let active = new Set(positiveIndices);
        const caps = marginiGrezzi.slice();
        while (remaining > 1e-6 && active.size > 0) {
          const quota = remaining / active.size; let allocatedThisRound = 0;
          for (const i of Array.from(active)) {
            const cap = caps[i] - bonifici[i]; const alloc = Math.min(quota, cap);
            if (alloc > 0) { bonifici[i] += alloc; allocatedThisRound += alloc; }
            if (Math.abs(caps[i] - bonifici[i]) <= 1e-9) active.delete(i);
          }
          if (allocatedThisRound <= 1e-9) break; remaining -= allocatedThisRound;
        }
        if (Ttot > sumPositiveMargins) { messaggio = `Nota: massimo trasferibile ${fmt(sumPositiveMargins)} € (< ${fmt(Ttot)} €); saldo finale previsto > desiderato.`; fattibile = false; }
      }
    }

    const out: ForecastMonth[] = []; let saldoChain = config.saldoInizialeCC;
    for (let i = 0; i < 12; i++) {
      const mese = i + 1; const entrate = entratePerMese[i]; const uscite = uscitePerMese[i]; const stipendio = stipendioPerMese[i];
      const bilancio = entrate - uscite; const saldoAttualeMese = saldoChain; const marginePrimaBonifico = saldoAttualeMese + bilancio;
      const bonifico = Math.min(bonifici[i], Math.max(0, marginePrimaBonifico)); const saldoFinale = marginePrimaBonifico - bonifico;
      out.push({ mese, saldoAttuale: round2(saldoAttualeMese), entrate: round2(entrate), stipendio: round2(stipendio), uscite: round2(uscite), bilancio: round2(bilancio), bonificoPrepagata: round2(bonifico), saldoFinale: round2(saldoFinale) });
      saldoChain = saldoFinale;
    }

    return { months: out, trasferibileTotale: round2(sum(out.map(x => x.bonificoPrepagata))), fattibile, messaggio, saldoFinaleAnnoPrevisto: round2(out[out.length - 1]?.saldoFinale || config.saldoInizialeCC) };
  }
}

function aggregateByMonth(items: Array<{ mese: number; importo: number }>): Record<number, number[]> {
  return items.reduce((acc: Record<number, number[]>, x) => { (acc[x.mese] = acc[x.mese] || []).push(x.importo); return acc; }, {});
}
function sum(arr: number[]): number { return arr.reduce((a, b) => a + b, 0); }
function round2(n: number): number { return Math.round(n * 100) / 100; }
function fmt(n: number): string { return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
