import React, {useEffect} from "react";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import DarkUnica from 'highcharts/themes/dark-unica';
import {useAuthState, useData} from "../../context";
import {fetchData} from "../../utils/utils";
import Filters from "../../components/Filters";
import {categories} from '../../utils/constants'
import DailyAverageTrend from "../../components/DailyAverageTrend";

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
  // yAxis: {
  //   stackLabels: {
  //     style: {
  //       fontSize: '13px',
  //     }
  //   },
  // },
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
  const { token, currency } = useAuthState();
  const loading = data.loading;

  useEffect(() => {
    if (noData) {
      fetchData(token, dataDispatch);
    }
  }, [data, dataDispatch, noData, token]);

  const items = data.filtered || data;

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


  // Last month section
  const oneMonthAgo = new Date().setDate(new Date().getDate()-30);
  const twoMonthsAgo = new Date().setDate(new Date().getDate()-60);
  const tomorrow = new Date().setHours(24,0,0,0);
  const lastMonthTotals = {};
  let lastTwoMonthsTotal = 0;
  let lastProcessedItem = {};
  let userHasMoreThanTwoMonths = false;
  for (let item of data.raw) {
    if (item.type === 'incomes') {
      continue;
    }
    const itemDate = new Date(item.dt);
    if (itemDate < twoMonthsAgo ) {
      userHasMoreThanTwoMonths = true;
      break;
    }
    lastProcessedItem = item;
    if (itemDate < tomorrow) {
      lastTwoMonthsTotal = (parseFloat(lastTwoMonthsTotal) + parseFloat(item.sum)).toFixed(2);
      if (itemDate > oneMonthAgo ) {
        const category = categories.find(element => element.value === item.cat).label;
        if (!lastMonthTotals[category]) {
          lastMonthTotals[category] = {name: category, y: 0};
        }
        lastMonthTotals[category].y = parseFloat((parseFloat(lastMonthTotals[category].y) + parseFloat(item.sum)).toFixed(2));
      }
    }
  }
  const timeDiff = new Date().getTime() - new Date(lastProcessedItem.dt).getTime();
  const daysDiff = userHasMoreThanTwoMonths ? 60 : timeDiff / (1000 * 3600 * 24);

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

  // All time section
  const nrOfMonths = data.groupedData ? Object.keys(data.groupedData).length : 0;
  const allTimeSpendings = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'All time spendings'
    },
    plotOptions: {
      pie: {
        borderWidth: 0
      },

    },
    series: [{
      name: currency,
      colorByPoint: true,
      data: Object.values(data.categoryTotals)
    }],
    credits: {
      enabled: false
    },
  };

  // Daily average section
  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed = parseInt((new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1);

  return (
    <div>
      <h2>Charts page</h2>
      <Filters />
      {loading ? <div className="lds-ripple"><div></div><div></div></div> : !noData &&
        <div className="charts-page">
          <div className="charts-section">
            <HighchartsReact
              highcharts={Highcharts}
              options={allTimeOptions}
            />
          </div>
          <div className="charts-section">
            <HighchartsReact
              highcharts={Highcharts}
              options={lastMonthOptions}
            />
          </div>
          <div className="charts-section">
            <HighchartsReact
              highcharts={Highcharts}
              options={allTimeSpendings}
            />
            <div className="average-spending">
              Total spent: {data.totalSpent} {currency} in {nrOfMonths} months
            </div>
          </div>
          <div className="charts-section">
            <span className="heading">Daily average per category</span>
            <table className="daily-average">
              <tbody>
              {Object.values(data.categoryTotals).map((item, key) => (
                <tr key={key}>
                  <td>{item.name}</td>
                  <td>{parseFloat(item.y / daysPassed).toFixed(2)} {currency} / day</td>
                </tr>
              ))}
              </tbody>
            </table>
            <div className="average-spending">
              Average spending per day: {parseFloat(data.totalSpentUntilTomorrow / daysPassed).toFixed(2)} {currency}
            </div>
          </div>

          {/*<div className="charts-section">*/}
          {/*  <DailyAverageTrend />*/}
          {/*</div>*/}

          {lastTwoMonthsTotal &&
            <div className="charts-section">
              <span>Average spending for the last 60 days: {parseFloat(lastTwoMonthsTotal / Math.ceil(daysDiff)).toFixed(2)} {currency} / day</span>
            </div>
          }
        </div>
      }
    </div>
  );
};

export default Charts;
