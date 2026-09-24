import Highcharts from 'highcharts';

const label = {
  color: 'rgba(255, 255, 255, 0.7)',
  fontFamily: 'inherit',
};

const axis = {
  gridLineColor: 'rgba(255, 255, 255, 0.08)',
  lineColor: 'rgba(255, 255, 255, 0.12)',
  tickColor: 'rgba(255, 255, 255, 0.12)',
  labels: { style: label },
  title: { style: label },
};

/**
 * Flat chart skin that sits on the page background, so it follows
 * the active theme without a separate color map.
 */
export function applyChartTheme() {
  Highcharts.setOptions({
    chart: {
      backgroundColor: 'transparent',
      plotBackgroundColor: 'transparent',
      style: {
        fontFamily: 'inherit',
      },
    },
    colors: [
      '#7ec8ca',
      '#e0a15a',
      '#8b91e0',
      '#7dba9a',
      '#d08b84',
      '#c4b07a',
      '#9aa8b8',
      '#c9b6e4',
      '#6aa8c8',
      '#d4a0b0',
    ],
    title: {
      style: {
        color: 'rgba(255, 255, 255, 0.92)',
        fontSize: '1.05rem',
        fontWeight: '600',
        fontFamily: 'inherit',
      },
    },
    subtitle: {
      style: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'inherit',
      },
    },
    xAxis: axis,
    yAxis: axis,
    legend: {
      itemStyle: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontFamily: 'inherit',
        fontWeight: '500',
      },
      itemHoverStyle: {
        color: '#ffffff',
      },
      itemHiddenStyle: {
        color: 'rgba(255, 255, 255, 0.35)',
      },
    },
    tooltip: {
      backgroundColor: '#2a3444',
      borderWidth: 0,
      shadow: false,
      style: {
        color: '#f4f6f8',
        fontSize: '14px',
        fontFamily: 'inherit',
      },
    },
    plotOptions: {
      series: {
        animation: false,
        boostThreshold: 4000,
        dataLabels: {
          color: 'rgba(255, 255, 255, 0.85)',
          style: {
            textOutline: 'none',
            fontFamily: 'inherit',
          },
        },
      },
      pie: {
        borderWidth: 0,
      },
      column: {
        borderWidth: 0,
      },
    },
    credits: {
      enabled: false,
    },
  });
}
