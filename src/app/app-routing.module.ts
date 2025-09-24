import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SpeseComponent } from './spese/spese.component';
import { EntrateComponent } from './entrate/entrate.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'spese', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'spese', component: SpeseComponent },
  { path: 'entrate', component: EntrateComponent },
  { path: '**', redirectTo: 'spese' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
