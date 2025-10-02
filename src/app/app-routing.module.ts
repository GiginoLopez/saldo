import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SpeseComponent } from './spese/spese.component';
import { EntrateComponent } from './entrate/entrate.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SaldiComponent } from './saldi/saldi.component';

const routes: Routes = [
  { path: '', redirectTo: 'grafici', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'spese', component: SpeseComponent },
  { path: 'entrate', component: EntrateComponent },
  { path: 'saldi', component: SaldiComponent },
  { path: 'grafici', loadChildren: () => import('./grafici/grafici.module').then(m => m.GraficiModule) },
  { path: '**', redirectTo: 'spese' }
];

@NgModule({ imports: [RouterModule.forRoot(routes, { useHash: true })], exports: [RouterModule] })
export class AppRoutingModule {}
