import React, { Suspense } from 'react';
import Highcharts from 'highcharts';
import DarkUnica from 'highcharts/themes/dark-unica';
import Filters from '../../components/transactions/Filters';
import MonthlyTotals from '../../components/charts/MonthlyTotals';
import YearAverageTrend from '../../components/charts/YearAverageTrend';
import TotalTransactionsCount from '../../components/transactions/TotalTransactionsCount';
import Boost from 'highcharts/modules/boost';
import NoData from 'highcharts/modules/no-data-to-display';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { useDataFetcher } from '../../hooks/useDataFetcher';
import { useIsVisible } from '../../hooks/useIsVisible';

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

/**
 * Wraps a lazy-loaded chart in a Suspense boundary + section div.
 * Defers rendering until the section is near the viewport (300px margin),
 * so off-screen charts don't compute data or initialize Highcharts on mount.
 */
const ChartSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ref, isVisible } = useIsVisible('300px');
  return (
    <div className="charts-section" ref={ref}>
      {isVisible ? (
        <Suspense fallback="">{children}</Suspense>
      ) : (
        <div style={{ minHeight: '250px' }} />
      )}
    </div>
  );
};

const Charts = () => {
  // React.lazy() inside the component is intentional here — on each mount,
  // new lazy wrappers suspend briefly (even for cached modules), giving React
  // a chance to paint the page structure first, then fill in the 7 heavy
  // Highcharts components progressively instead of blocking in one render pass.
  const AllTimeSpendings = React.lazy(
    () => import('../../components/charts/AllTimeSpendings')
  );
  const MonthlyAverage = React.lazy(
    () => import('../../components/charts/MonthlyAverage')
  );
  const SavingsHistory = React.lazy(
    () => import('../../components/charts/SavingsHistory')
  );
  const DailyAverage = React.lazy(
    () => import('../../components/charts/DailyAverage')
  );
  const DailyAverageTrend = React.lazy(
    () => import('../../components/charts/DailyAverageTrend')
  );
  const MonthlyAverageTrend = React.lazy(
    () => import('../../components/charts/MonthlyAverageTrend')
  );
  const LastTwoMonthsAverage = React.lazy(
    () => import('../../components/charts/LastTwoMonthsAverage')
  );

  const { data, noData, loading } = useDataFetcher();
  const noEntries = Object.keys(data.raw).length === 0;

  return (
    <div>
      <h2>Charts page</h2>
      {!loading && !noEntries && <TotalTransactionsCount />}
      <Filters />
      {loading ? (
        <PageLoader />
      ) : (
        !noEntries && (
          <div className="charts-page">
            <div className="charts-section">
              <MonthlyTotals />
            </div>
            <div className="charts-section">
              <YearAverageTrend />
            </div>
            <ChartSection><AllTimeSpendings /></ChartSection>
            <ChartSection><MonthlyAverage /></ChartSection>
            <ChartSection><MonthlyAverageTrend /></ChartSection>
            <ChartSection><SavingsHistory /></ChartSection>
            <ChartSection><DailyAverage /></ChartSection>
            <ChartSection><DailyAverageTrend /></ChartSection>
            <ChartSection><LastTwoMonthsAverage /></ChartSection>
          </div>
        )
      )}
    </div>
  );
};

export default Charts;
