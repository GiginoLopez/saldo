import { Component } from '@angular/core';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html'
})
export class BarChartComponent {
  public barChartOptions = {
    responsive: true,
    scales: {
      xAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Categorie'
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Saldo'
        }
      }]
    }
  };
  public barChartLabels = ['Spese', 'Eccedenza'];
  public barChartType = 'bar';
  public barChartLegend = true;
  public barChartData = [
    { data: [1200, 800], label: 'Distribuzione' }
  ];
}