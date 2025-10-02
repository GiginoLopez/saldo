import { Component } from '@angular/core';

@Component({
  selector: 'app-doughnut-chart',
  templateUrl: './doughnut-chart.component.html'
})
export class DoughnutChartComponent {
  public doughnutChartLabels = ['Spese', 'Eccedenza'];
  public doughnutChartData = [1200, 800];
  public doughnutChartType = 'doughnut';
}