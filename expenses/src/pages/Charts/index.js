import React, { useEffect, Suspense } from "react";
import Highcharts from 'highcharts';
import DarkUnica from 'highcharts/themes/dark-unica';
import {useAuthDispatch, useAuthState, useData} from "../../context";
import {fetchData} from "../../utils/utils";
import Filters from "../../components/Filters";
// import DailyAverageTrend from "../../components/DailyAverageTrend";
import MonthlyTotals from "../../components/MonthlyTotals";
// import LastMonth from "../../components/LastMonth";
// import AllTimeSpendings from "../../components/AllTimeSpendings";
// import DailyAverage from "../../components/DailyAverage";
// import LastTwoMonthsAverage from "../../components/LastTwoMonthsAverage";

const LastMonth = React.lazy(() => import("../../components/LastMonth"));
const AllTimeSpendings = React.lazy(() => import("../../components/AllTimeSpendings"));
const DailyAverage = React.lazy(() => import("../../components/DailyAverage"));
const LastTwoMonthsAverage = React.lazy(() => import("../../components/LastTwoMonthsAverage"));
const DailyAverageTrend = React.lazy(() => import("../../components/DailyAverageTrend"));

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
            <Suspense fallback={<div className="lds-ripple"><div></div><div></div></div>}>
              <LastMonth />
            </Suspense>
          </div>

          <div className="charts-section">
            <Suspense fallback={<div className="lds-ripple"><div></div><div></div></div>}>
              <AllTimeSpendings />
            </Suspense>
          </div>

          <div className="charts-section">
            <Suspense fallback={<div className="lds-ripple"><div></div><div></div></div>}>
              <DailyAverage />
            </Suspense>
          </div>

          <div className="charts-section">
            <Suspense fallback={<div className="lds-ripple"><div></div><div></div></div>}>
              <DailyAverageTrend />
            </Suspense>
          </div>

          <div className="charts-section">
            <Suspense fallback={<div className="lds-ripple"><div></div><div></div></div>}>
              <LastTwoMonthsAverage />
            </Suspense>
          </div>

        </div>
      }
    </div>
  );
};

export default Charts;
