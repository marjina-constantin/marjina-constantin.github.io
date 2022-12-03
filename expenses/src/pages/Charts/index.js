import React, {useEffect} from "react";
import Highcharts from 'highcharts';
import DarkUnica from 'highcharts/themes/dark-unica';
import {useAuthDispatch, useAuthState, useData} from "../../context";
import {fetchData} from "../../utils/utils";
import Filters from "../../components/Filters";
import DailyAverageTrend from "../../components/DailyAverageTrend";
import MonthlyTotals from "../../components/MonthlyTotals";
import LastMonth from "../../components/LastMonth";
import AllTimeSpendings from "../../components/AllTimeSpendings";
import DailyAverage from "../../components/DailyAverage";
import LastTwoMonthsAverage from "../../components/LastTwoMonthsAverage";

DarkUnica(Highcharts);

Highcharts.theme = {
  chart: {
    backgroundColor: '#282a36',
  },
  tooltip: {
    style: {
      fontSize: '15px',
    }
  },
};

Highcharts.setOptions(Highcharts.theme);
// Radialize the colors
Highcharts.setOptions({
  colors: Highcharts.map(Highcharts.getOptions().colors, function (color) {
    return {
      radialGradient: {
        cx: 0.5,
        cy: 0.3,
        r: 0.7
      },
      stops: [
        [0, color],
        [1, Highcharts.color(color).brighten(-0.25).get('rgb')] // darken
      ]
    };
  })
});
Highcharts.setOptions({
  plotOptions: {
    series: {
      animation: false
    }
  }
});

// Highcharts.setOptions({
//   plotOptions: {
//     column: { animation: false, enableMouseTracking: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
//     pie: { animation: false, enableMouseTracking: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
//     spline: { animation: false, enableMouseTracking: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
//   },
//   chart: {
//     reflow: false,
//     events: {
//       redraw: function() {
//         console.log("highcharts redraw, rendering-done");
//       }
//     },
//     animation: false
//   },
//   tooltip: {
//     enabled: false,
//     animation: false
//   },
//   exporting: {
//     enabled:false
//   },
//   credits: {
//     enabled: false
//   }
// });

const Charts = () => {

  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;
  const { token } = useAuthState();
  const loading = data.loading;
  const dispatch = useAuthDispatch();

  useEffect(() => {
    if (noData) {
      fetchData(token, dataDispatch, dispatch);
    }
  }, [data, dataDispatch, noData, token, dispatch]);

  return (
    <div>
      <h2>Charts page</h2>
      <Filters />
      {loading ? <div className="lds-ripple"><div></div><div></div></div> : !noData &&
        <div className="charts-page">

          <div className="charts-section">
            <MonthlyTotals />
          </div>

          <div className="charts-section">
            <LastMonth />
          </div>

          <div className="charts-section">
            <AllTimeSpendings />
          </div>

          <div className="charts-section">
            <DailyAverage />
          </div>

          <div className="charts-section">
            <DailyAverageTrend />
          </div>

          <div className="charts-section">
            <LastTwoMonthsAverage />
          </div>

        </div>
      }
    </div>
  );
};

export default Charts;
