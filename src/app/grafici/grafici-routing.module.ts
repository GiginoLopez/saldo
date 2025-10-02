import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraficiComponent } from './grafici.component';

const routes: Routes = [
  { path: '', component: GraficiComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GraficiRoutingModule {}