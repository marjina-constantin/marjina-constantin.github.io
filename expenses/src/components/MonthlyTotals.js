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

  const allTimeOptions = {
    chart: {
      type: 'column',
      zoomType: 'x',
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
      }
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
