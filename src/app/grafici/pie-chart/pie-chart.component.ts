import { Component } from '@angular/core';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html'
})
export class PieChartComponent {
  public pieChartLabels = ['Spese', 'Eccedenza'];
  public pieChartData = [1200, 800];
  public pieChartType = 'pie';
}