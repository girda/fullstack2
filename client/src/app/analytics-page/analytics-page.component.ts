import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AnalyticsService} from "../shared/services/analytics.service";
import {AnalyticsPage} from "../shared/interfaces";
import {Subscription} from "rxjs";
import {Chart} from 'chart.js'

@Component({
  selector: 'app-analytics-page',
  templateUrl: './analytics-page.component.html',
  styleUrls: ['./analytics-page.component.css']
})
export class AnalyticsPageComponent implements AfterViewInit, OnDestroy {

  @ViewChild('gain', {static: false}) gainRef: ElementRef;
  @ViewChild('order', {static: false}) orderRef: ElementRef;

  aSub: Subscription;
  averageCheck: number;
  pending: boolean = true;

  constructor(private serviceAnalytics: AnalyticsService,) {
  }

  ngAfterViewInit(): void {
    const gainConfig: any = {
      label: 'Выручка',
      color: 'rgb(255, 99, 132)'
    };

    const orderConfig: any = {
      label: 'Заказы',
      color: 'rgb(54, 162, 235)'
    };

    this.serviceAnalytics.getAnalytics().subscribe((data: AnalyticsPage) => {
      this.averageCheck = data.averageCheck;

      gainConfig.labels = data.chart.map(item => item.label);
      gainConfig.data = data.chart.map(item => item.gain);
      orderConfig.labels = data.chart.map(item => item.label);
      orderConfig.data = data.chart.map(item => item.order);


      const gainCtx = this.gainRef.nativeElement.getContext('2d');
      gainCtx.canvas.height = '300px';
      const orderCtx = this.orderRef.nativeElement.getContext('2d');
      orderCtx.canvas.height = '300px';

      new Chart(gainCtx, createChartConfig(gainConfig));
      new Chart(orderCtx, createChartConfig(orderConfig));
      this.pending = false
    })
  }

  ngOnDestroy(): void {
    if (this.aSub) {
      this.aSub.unsubscribe();
    }
  }

}

function createChartConfig(config) {
  return {
    type: 'line',
    options: {
      responsive: true
    },
    data: {
      labels: config.labels,
      datasets: [
        {
          label: config.label,
          data: config.data,
          borderColor: config.color,
          steppedLine: false,
          fill: false
        }
      ]

    }
  }
}
