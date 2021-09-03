import React, {useEffect} from "react";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import DarkUnica from 'highcharts/themes/dark-unica';
import {useAuthState, useData} from "../../context";
import {fetchData} from "../../utils/utils";
import Filters from "../../components/Filters";

DarkUnica(Highcharts);

const Charts = () => {

  const { data, dataDispatch } = useData();
  const noData = data.groupedData === null;
  const { token } = useAuthState();

  useEffect(() => {
    if (noData) {
      fetchData(token, dataDispatch);
    }
  }, [data]);

  const items = data.filtered || data;

  const options = {
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
      name: 'Monthly totals',
      data: items.totals ? Object.values(items.totals).reverse() : []

    }],
  }

  return (
    <div>
      <h2>Charts page</h2>
      <Filters />
      <div className="charts-page">
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
        />
      </div>
    </div>
  );
};

export default Charts;
