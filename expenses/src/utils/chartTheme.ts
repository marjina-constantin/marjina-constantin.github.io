import Highcharts from 'highcharts';

const cssToken = (name: string, fallback: string) => {
  if (typeof document === 'undefined') return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
};

/**
 * Flat chart skin that sits on the page background, so it follows
 * the active theme without a separate color map.
 */
export function applyChartTheme(appearance?: 'dark' | 'light') {
  const isLight =
    appearance === 'light' ||
    (appearance == null &&
      typeof document !== 'undefined' &&
      document.documentElement.dataset.appearance === 'light');
  const textPrimary = cssToken(
    '--text-primary',
    isLight ? 'rgba(22, 32, 51, 0.92)' : 'rgba(255, 255, 255, 0.87)'
  );
  const textSecondary = cssToken(
    '--text-secondary',
    isLight ? 'rgba(22, 32, 51, 0.64)' : 'rgba(255, 255, 255, 0.60)'
  );
  const textMuted = cssToken(
    '--text-muted',
    isLight ? 'rgba(22, 32, 51, 0.45)' : 'rgba(255, 255, 255, 0.42)'
  );
  const border = cssToken(
    '--surface-border-strong',
    isLight ? 'rgba(22, 32, 51, 0.14)' : 'rgba(255, 255, 255, 0.10)'
  );
  const grid = cssToken(
    '--surface-border',
    isLight ? 'rgba(22, 32, 51, 0.08)' : 'rgba(255, 255, 255, 0.06)'
  );
  const tooltipBg = isLight ? '#ffffff' : '#192338';
  const tooltipBorder = isLight ? 'rgba(22, 32, 51, 0.12)' : border;

  const label = {
    color: textSecondary,
    fontFamily: 'inherit',
  };

  const axis = {
    gridLineColor: grid,
    lineColor: border,
    tickColor: border,
    labels: { style: label },
    title: { style: label },
  };

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
        color: textPrimary,
        fontSize: '1.05rem',
        fontWeight: '600',
        fontFamily: 'inherit',
      },
    },
    subtitle: {
      style: {
        color: textSecondary,
        fontFamily: 'inherit',
      },
    },
    xAxis: axis,
    yAxis: axis,
    legend: {
      itemStyle: {
        color: textPrimary,
        fontFamily: 'inherit',
        fontWeight: '500',
      },
      itemHoverStyle: {
        color: textPrimary,
      },
      itemHiddenStyle: {
        color: textMuted,
      },
    },
    tooltip: {
      backgroundColor: tooltipBg,
      borderWidth: 1,
      borderColor: tooltipBorder,
      borderRadius: 10,
      shadow: false,
      style: {
        color: textPrimary,
        fontSize: '14px',
        fontFamily: 'inherit',
      },
    },
    plotOptions: {
      series: {
        animation: false,
        boostThreshold: 4000,
        dataLabels: {
          color: textPrimary,
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
