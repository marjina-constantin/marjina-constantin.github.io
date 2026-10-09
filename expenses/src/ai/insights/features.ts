import * as builders from './builders';
import { InsightBuilder } from './builders';

export interface InsightFeature {
  label: string;
  task: string;
  build: InsightBuilder;
}

const explain = (name: string) =>
  `Explain what the "${name}" chart says about the user's finances: overall trend, notable changes, outliers or seasonality, and what deserves attention.`;

export const INSIGHT_FEATURES = {
  month: {
    label: 'Month summary',
    task: "Summarize this month's spending: how it compares with the previous 3 and 12 month averages, which categories drove it, unusual or large expenses and, for the current month, whether the projection is on track.",
    build: builders.buildMonthInsight,
  },
  allTime: {
    label: 'All-time overview',
    task: "Give an overview of the user's whole history: long-term spending trend, best and worst years, categories that grew or shrank, savings over time and lasting habits.",
    build: builders.buildAllTimeInsight,
  },
  incomeMonth: {
    label: 'This month',
    task: "Summarize this month's income and savings compared with the user's usual levels over the previous 12 months. The month may still be in progress.",
    build: builders.buildIncomeMonthInsight,
  },
  incomeAll: {
    label: 'All-time income',
    task: 'Analyze income over time: growth, stability, main sources and their evolution, savings rate trend and deficit months.',
    build: builders.buildIncomeAllInsight,
  },
  monthlyTotals: { label: 'Explain', task: explain('Monthly totals'), build: builders.buildMonthlyTotalsInsight },
  yearsInReview: { label: 'Explain', task: explain('Years in review'), build: builders.buildYearsInReviewInsight },
  allTimeSpendings: { label: 'Explain', task: explain('All time spendings'), build: builders.buildAllTimeSpendingsInsight },
  monthlyAverage: { label: 'Explain', task: explain('Monthly average per category'), build: builders.buildMonthlyAverageInsight },
  monthlyAverageTrend: { label: 'Explain', task: explain('Monthly average trends'), build: builders.buildMonthlyAverageTrendInsight },
  savingsHistory: { label: 'Explain', task: explain('Savings history'), build: builders.buildSavingsHistoryInsight },
  dailyAverage: { label: 'Explain', task: explain('Daily average per category'), build: builders.buildDailyAverageInsight },
  dailyAverageTrend: { label: 'Explain', task: explain('Daily average trends'), build: builders.buildDailyAverageTrendInsight },
  incomeSources: { label: 'Explain', task: explain('Income sources'), build: builders.buildIncomeSourcesInsight },
  yearIncome: { label: 'Explain', task: explain('Income years in review'), build: builders.buildYearIncomeInsight },
} satisfies Record<string, InsightFeature>;

export type InsightFeatureId = keyof typeof INSIGHT_FEATURES;
