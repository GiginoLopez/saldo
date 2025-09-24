
export type Year = number;
export interface YearConfig { year: Year; saldoInizialeCC: number; saldoFinaleDesideratoCC: number; }
export interface MonthlyExpense { id: string; descrizione: string; importo: number; active: boolean; }
export interface AnnualExpense { id: string; descrizione: string; importo: number; mese: number; }
export type IncomeType = 'stipendio' | 'altro';
export interface MonthlyIncome { id: string; descrizione: string; importo: number; type: IncomeType; }
export interface OneOffIncome { id: string; descrizione: string; importo: number; mese: number; type?: IncomeType; }
export interface PrepaidSnapshot { id: string; date: string; saldo: number; note?: string; }
export interface YearData { config: YearConfig; monthlyExpenses: MonthlyExpense[]; annualExpenses: AnnualExpense[]; monthlyIncomes: MonthlyIncome[]; oneOffIncomes: OneOffIncome[]; prepaidSnapshots: PrepaidSnapshot[]; }
export interface AppState { version: number; years: Year[]; dataByYear: Record<Year, YearData>; }
export interface ForecastMonth { mese: number; saldoAttuale: number; entrate: number; stipendio: number; uscite: number; bilancio: number; bonificoPrepagata: number; saldoFinale: number; }
export interface ForecastResult { months: ForecastMonth[]; trasferibileTotale: number; fattibile: boolean; messaggio?: string; saldoFinaleAnnoPrevisto: number; }
