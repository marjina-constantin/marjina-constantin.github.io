import React, {useEffect} from "react";
// import Highcharts from 'highcharts';
// import HighchartsReact from 'highcharts-react-official';
// import DarkUnica from 'highcharts/themes/dark-unica';
import {useAuthState, useData} from "../../context";
import {fetchData} from "../../utils/utils";
import Filters from "../../components/Filters";
import {categories} from '../../utils/constants'

// DarkUnica(Highcharts);

// Highcharts.theme = {
//   chart: {
//     backgroundColor: '#282a36',
//   },
//   tooltip: {
//     style: {
//       fontSize: '15px',
//     }
//   },
//   // yAxis: {
//   //   stackLabels: {
//   //     style: {
//   //       fontSize: '13px',
//   //     }
//   //   },
//   // },
// };
//
// Highcharts.setOptions(Highcharts.theme);

const Charts = () => {

  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;
  const { token } = useAuthState();
  const loading = data.loading;

  useEffect(() => {
    if (noData) {
      fetchData(token, dataDispatch);
    }
  }, [data, dataDispatch, noData, token]);

  const items = data.filtered || data;

  const allTimeOptions = {
    chart: {
      type: 'column'
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
        text: 'MDL'
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
    series: [{
      name: data.category ? categories.find(element => element.value === data.category).label : 'Monthly totals',
      data: items.totals ? Object.values(items.totals).reverse() : []

    }],
  }
  console.log('allTimeOptions', allTimeOptions)


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
      lastTwoMonthsTotal += parseInt(item.sum);
      if (itemDate > oneMonthAgo ) {
        const category = categories.find(element => element.value === item.cat).label;
        if (!lastMonthTotals[category]) {
          lastMonthTotals[category] = {name: category, y: 0};
        }
        lastMonthTotals[category].y += parseInt(item.sum);
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
      name: 'MDL',
      colorByPoint: true,
      data: Object.values(lastMonthTotals)
    }]
  };
  console.log('lastMonthOptions', lastMonthOptions)

  // All time section
  let totalSpent = 0;
  const nrOfMonths = data.groupedData ? Object.keys(data.groupedData).length : 0;
  for (let item of Object.values(data.categoryTotals)) {
    totalSpent += item.y;
  }
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
      name: 'MDL',
      colorByPoint: true,
      data: Object.values(data.categoryTotals)
    }]
  };
  console.log('allTimeSpendings', allTimeSpendings)

  return (
    <div>
      <h2>Charts page</h2>
      <Filters />
      {loading ? <div className="lds-ripple"><div></div><div></div></div> : !noData &&
        <div className="charts-page">
          {/*<HighchartsReact*/}
          {/*  highcharts={Highcharts}*/}
          {/*  options={allTimeOptions}*/}
          {/*/>*/}
          {/*<hr/>*/}
          {/*<HighchartsReact*/}
          {/*  highcharts={Highcharts}*/}
          {/*  options={lastMonthOptions}*/}
          {/*/>*/}
          {/*<hr/>*/}
          {/*<HighchartsReact*/}
          {/*  highcharts={Highcharts}*/}
          {/*  options={allTimeSpendings}*/}
          {/*/>*/}
          <div className="average-spending">
            Total spent: {totalSpent} mdl in {nrOfMonths} months
          </div>
          <hr/>
          {lastTwoMonthsTotal &&
            <div className="average-spending">
              Average spending for the last 60 days: {parseInt(lastTwoMonthsTotal / Math.ceil(daysDiff))} mdl / day
            </div>
          }
        </div>
      }
    </div>
  );
};

export default Charts;
