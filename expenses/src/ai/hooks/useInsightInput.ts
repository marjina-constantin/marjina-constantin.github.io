import { useMemo } from 'react';
import { useAuthState, useData } from '../../context';
import { AuthState } from '../../types/types';
import { categoryLabel, getAiItems } from '../data';
import { InsightInput } from '../insights/builders';
import { getShareDescriptions } from '../storage';

/** The data each insight builder sees, with the same filters the UI applies. */
export function useInsightInput(): InsightInput {
  const { data } = useData();
  const { currency } = useAuthState() as AuthState;

  return useMemo(() => {
    const all = getAiItems(data.raw || []);
    const expenses = data.filteredRaw
      ? getAiItems(data.filteredRaw)
      : all.filter((i) => i.kind === 'expense');
    const incomes = getAiItems(data.filteredIncomeData ?? data.incomeData ?? []);

    const expenseFilter = [
      data.category && `category ${categoryLabel(data.category)}`,
      data.textFilter && `description contains "${data.textFilter}"`,
    ]
      .filter(Boolean)
      .join(', ');
    const incomeFilter = [
      data.incomeTextFilter && `description contains "${data.incomeTextFilter}"`,
      data.incomeSelectedTags?.length && `tags ${data.incomeSelectedTags.map((t) => `#${t}`).join(' ')}`,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      all,
      expenses,
      incomes,
      expenseFilter,
      incomeFilter,
      currency,
      share: getShareDescriptions(),
    };
  }, [
    data.raw,
    data.filteredRaw,
    data.incomeData,
    data.filteredIncomeData,
    data.category,
    data.textFilter,
    data.incomeTextFilter,
    data.incomeSelectedTags,
    currency,
  ]);
}
