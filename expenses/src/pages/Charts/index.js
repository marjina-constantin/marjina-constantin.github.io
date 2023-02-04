import React, {Suspense, useEffect} from "react";
import Highcharts from 'highcharts';
import DarkUnica from 'highcharts/themes/dark-unica';
import {useAuthDispatch, useAuthState, useData} from "../../context";
import {fetchData} from "../../utils/utils";
import Filters from "../../components/Filters";
import MonthlyTotals from "../../components/MonthlyTotals";
import LastMonth from "../../components/LastMonth";
import AllTimeSpendings from "../../components/AllTimeSpendings";
import DailyAverage from "../../components/DailyAverage";
import MonthlyAverage from "../../components/MonthlyAverage";
import LastTwoMonthsAverage from "../../components/LastTwoMonthsAverage";
import Boost from "highcharts/modules/boost";

Boost(Highcharts);
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
      animation: true,
      boostThreshold: 4000,
    }
  }
});

const Charts = () => {
  const DailyAverageTrend = React.lazy(() => import("../../components/DailyAverageTrend"));

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
            <MonthlyAverage />
          </div>

          <div className="charts-section">
            <DailyAverage />
          </div>

          <div className="charts-section">
            <Suspense fallback=''>
              <DailyAverageTrend />
            </Suspense>
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
