export type ChatChartType = 'column' | 'line' | 'pie';

export interface ChatChartSeries {
  name: string;
  data: number[];
}

/** Compact spec stored on the chat message and redrawn after reload. */
export interface ChatChart {
  type: ChatChartType;
  title: string;
  currency: string;
  categories: string[];
  series: ChatChartSeries[];
}

const TYPES: ChatChartType[] = ['column', 'line', 'pie'];

export const isChatChart = (value: unknown): value is ChatChart => {
  if (!value || typeof value !== 'object') return false;
  const chart = value as ChatChart;
  return (
    TYPES.includes(chart.type) &&
    typeof chart.title === 'string' &&
    typeof chart.currency === 'string' &&
    Array.isArray(chart.categories) &&
    chart.categories.length > 0 &&
    chart.categories.length <= 24 &&
    Array.isArray(chart.series) &&
    chart.series.length > 0 &&
    chart.series.length <= 8 &&
    chart.series.every(
      (s) =>
        typeof s?.name === 'string' &&
        Array.isArray(s.data) &&
        s.data.length === chart.categories.length &&
        s.data.every((n) => typeof n === 'number' && Number.isFinite(n))
    )
  );
};
