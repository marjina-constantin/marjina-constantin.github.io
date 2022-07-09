import React, {useEffect} from "react";
import {useAuthState, useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {categories} from "../utils/constants";

export default function LastMonth() {
  // Last month section
  const { data } = useData();
  const { currency } = useAuthState();

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.raw, currency]);

  const oneMonthAgo = new Date().setDate(new Date().getDate()-30);
  const lastMonthTotals = {};
  for (let item of data.raw) {
    if (item.type === 'incomes') {
      continue;
    }
    const itemDate = new Date(item.dt);
    if (itemDate > oneMonthAgo ) {
      const category = categories.find(element => element.value === item.cat).label;
      if (!lastMonthTotals[category]) {
        lastMonthTotals[category] = {name: category, y: 0};
      }
      lastMonthTotals[category].y = parseFloat((parseFloat(lastMonthTotals[category].y) + parseFloat(item.sum)).toFixed(2));
    }
  }

  const lastMonthOptions = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'Last 30 days spendings'
    },
    plotOptions: {
      pie: {
        borderWidth: 0
      },

    },
    series: [{
      name: currency,
      colorByPoint: true,
      data: Object.values(lastMonthTotals)
    }],
    credits: {
      enabled: false
    },
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={lastMonthOptions}
    />
  )
}
