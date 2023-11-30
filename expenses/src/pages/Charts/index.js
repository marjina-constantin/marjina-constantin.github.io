import React, {Suspense, useEffect} from "react";
import Highcharts from 'highcharts';
import DarkUnica from 'highcharts/themes/dark-unica';
import {useAuthDispatch, useAuthState, useData} from "../../context";
import {fetchData} from "../../utils/utils";
import Filters from "../../components/Filters";
import MonthlyTotals from "../../components/MonthlyTotals";
import YearAverageTrend from "../../components/YearAverageTrend";
import Boost from "highcharts/modules/boost";
import NoData from "highcharts/modules/no-data-to-display";

Boost(Highcharts);
DarkUnica(Highcharts);
NoData(Highcharts);

const bgColors = {
  'carrot-orange': '#102433',
  'inchworm': '#201f1e',
}
const theme = localStorage.getItem('theme') || 'blue-pink-gradient';

Highcharts.theme = {
  chart: {
    backgroundColor: theme ? bgColors[theme] : '#282a36',
  },
  tooltip: {
    style: {
      fontSize: '15px',
    }
  },
};

const colors = [
  '#fe4a49',
  '#fed766',
  '#0e9aa7',
  '#fe9c8f',
  '#fce9db',
  '#4d648d',
  '#ffeead',
  '#ff6f69',
  '#ffcc5c',
  '#88d8b0',
  '#3385c6',
  '#bbbbbb',
  '#8874a3',
  '#ff7f51',
];

// Function to shuffle the array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

// Shuffle the colors array
shuffleArray(colors);

Highcharts.setOptions(Highcharts.theme);
// Radialize the colors
Highcharts.setOptions({
  colors: Highcharts.map(colors, function (color) {
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
      animation: false,
      boostThreshold: 4000,
    }
  }
});

const Charts = () => {
  const AllTimeSpendings = React.lazy(() => import("../../components/AllTimeSpendings"));
  const MonthlyAverage = React.lazy(() => import("../../components/MonthlyAverage"));
  const SavingsHistory = React.lazy(() => import("../../components/SavingsHistory"));
  const DailyAverage = React.lazy(() => import("../../components/DailyAverage"));
  const DailyAverageTrend = React.lazy(() => import("../../components/DailyAverageTrend"));
  const LastTwoMonthsAverage = React.lazy(() => import("../../components/LastTwoMonthsAverage"));

  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;
  const noEntries = Object.keys(data.raw).length === 0;
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
      {loading ? <div className="lds-ripple"><div></div><div></div></div> : !noEntries &&
        <div className="charts-page">

          <div className="charts-section">
            <MonthlyTotals />
          </div>

          <div className="charts-section">
            <YearAverageTrend />
          </div>

          <div className="charts-section">
            <Suspense fallback=''>
              <AllTimeSpendings />
            </Suspense>
          </div>

          <div className="charts-section">
            <Suspense fallback=''>
              <MonthlyAverage />
            </Suspense>
          </div>

          <div className="charts-section">
            <Suspense fallback=''>
              <SavingsHistory />
            </Suspense>
          </div>

          <div className="charts-section">
            <Suspense fallback=''>
              <DailyAverage />
            </Suspense>
          </div>

          <div className="charts-section">
            <Suspense fallback=''>
              <DailyAverageTrend />
            </Suspense>
          </div>

          <div className="charts-section">
            <Suspense fallback=''>
              <LastTwoMonthsAverage />
            </Suspense>
          </div>

        </div>
      }
    </div>
  );
};

export default Charts;
