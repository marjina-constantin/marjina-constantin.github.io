import React, {useEffect} from "react";
import {useAuthState, useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {categories} from "../utils/constants";

export default function MonthlyTotals() {

  const { data } = useData();
  const items = data.filtered || data;
  const { currency } = useAuthState();

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data, currency]);

  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed = parseInt((new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1);
  const monthsPassed = parseFloat(daysPassed / 30.42).toFixed(2);
  const monthlyAverage = parseFloat(items.totalSpent / monthsPassed).toFixed(2);

  const start = new Date();
  const allTimeOptions = {
    chart: {
      type: 'column',
      zoomType: 'x',
      events: {
        render: function () {
          this.setTitle(null, {
            text: 'Rendered chart in ' + (new Date() - start) + 'ms'
          });
        }
      },
    },
    title: {
      text: 'Monthly Totals'
    },
    xAxis: {
      categories: items.totals ? Object.keys(items.totals).reverse() : []
    },
    yAxis: {
      min: 0,
      title: {
        text: currency
      },
      stackLabels: {
        style: {
          color: '#FFFFFF',
          fontWeight: 'bold'
        },
        enabled: true,
        verticalAlign: 'top'
      },
      plotLines: [{
        color: '#00a8ad',
        value: monthlyAverage,
        width: '1',
        zIndex: 4,
        dashStyle: 'ShortDot',
      }]
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        stacking: 'normal',
        groupPadding: 0,
      },
      series: {
        colorByPoint: true,
      }
    },
    credits: {
      enabled: false
    },
    series: [{
      name: data.category ? categories.find(element => element.value === data.category).label : 'Monthly totals',
      data: items.totals ? Object.values(items.totals).reverse() : []

    }],
  }

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={allTimeOptions}
    />
  )
}
