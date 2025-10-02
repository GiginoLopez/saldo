import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraficiComponent } from './grafici.component';
import { GraficiRoutingModule } from './grafici-routing.module';
import { ChartsModule } from 'ng2-charts';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { DoughnutChartComponent } from './doughnut-chart/doughnut-chart.component';

@NgModule({
  declarations: [
    GraficiComponent,
    BarChartComponent,
    PieChartComponent,
    DoughnutChartComponent
  ],
  imports: [
    CommonModule,
    ChartsModule,
    GraficiRoutingModule
  ]
})
export class GraficiModule {}