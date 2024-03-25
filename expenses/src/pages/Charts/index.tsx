import React, { Suspense, useEffect } from 'react';
import Highcharts from 'highcharts';
import DarkUnica from 'highcharts/themes/dark-unica';
import { useAuthDispatch, useAuthState, useData } from '../../context';
import { fetchData } from '../../utils/utils';
import Filters from '../../components/Filters';
import MonthlyTotals from '../../components/MonthlyTotals';
import YearAverageTrend from '../../components/YearAverageTrend';
import Boost from 'highcharts/modules/boost';
import NoData from 'highcharts/modules/no-data-to-display';
import { AuthState } from '../../type/types';

Boost(Highcharts);
DarkUnica(Highcharts);
NoData(Highcharts);

const bgColors: Record<string, string> = {
  'carrot-orange': '#102433',
  inchworm: '#201f1e',
};
const theme = localStorage.getItem('theme') || 'blue-pink-gradient';

Highcharts.theme = {
  chart: {
    backgroundColor: theme ? bgColors[theme] : '#282a36',
  },
  tooltip: {
    style: {
      fontSize: '15px',
    },
  },
};

Highcharts.setOptions(Highcharts.theme);
// Radialize the colors
Highcharts.setOptions({
  colors:
    (Highcharts.getOptions().colors || []).map(
      (
        color:
          | string
          | Highcharts.GradientColorObject
          | Highcharts.PatternObject
      ) => {
        return {
          radialGradient: {
            cx: 0.5,
            cy: 0.3,
            r: 0.7,
          },
          stops: [
            [0, color],
            [
              1,
              Highcharts.color(color as string)
                .brighten(-0.25)
                .get('rgb'),
            ], // darken
          ] as Highcharts.GradientColorObject['stops'],
        };
      }
    ) ?? [],
});
Highcharts.setOptions({
  plotOptions: {
    series: {
      animation: false,
      boostThreshold: 4000,
    },
  },
});

const Charts = () => {
  const AllTimeSpendings = React.lazy(
    () => import('../../components/AllTimeSpendings')
  );
  const MonthlyAverage = React.lazy(
    () => import('../../components/MonthlyAverage')
  );
  const SavingsHistory = React.lazy(
    () => import('../../components/SavingsHistory')
  );
  const DailyAverage = React.lazy(
    () => import('../../components/DailyAverage')
  );
  const DailyAverageTrend = React.lazy(
    () => import('../../components/DailyAverageTrend')
  );
  const LastTwoMonthsAverage = React.lazy(
    () => import('../../components/LastTwoMonthsAverage')
  );

  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;
  const noEntries = Object.keys(data.raw).length === 0;
  const { token } = useAuthState() as AuthState;
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
      {loading ? (
        <div className="lds-ripple">
          <div></div>
          <div></div>
        </div>
      ) : (
        !noEntries && (
          <div className="charts-page">
            <div className="charts-section">
              <MonthlyTotals />
            </div>

            <div className="charts-section">
              <YearAverageTrend />
            </div>

            <div className="charts-section">
              <Suspense fallback="">
                <AllTimeSpendings />
              </Suspense>
            </div>

            <div className="charts-section">
              <Suspense fallback="">
                <MonthlyAverage />
              </Suspense>
            </div>

            <div className="charts-section">
              <Suspense fallback="">
                <SavingsHistory />
              </Suspense>
            </div>

            <div className="charts-section">
              <Suspense fallback="">
                <DailyAverage />
              </Suspense>
            </div>

            <div className="charts-section">
              <Suspense fallback="">
                <DailyAverageTrend />
              </Suspense>
            </div>

            <div className="charts-section">
              <Suspense fallback="">
                <LastTwoMonthsAverage />
              </Suspense>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Charts;
