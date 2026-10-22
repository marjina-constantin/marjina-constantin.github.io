import { AiItem, categoryLabel, round } from '../ai/data';
import { monthNames } from '../utils/constants';

export type BudgetWindow = 1 | 3 | 6 | 12;

export const calendarMonthLabel = (date: Date) =>
  `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

export const latestMonthLabel = (labels: string[]) => {
  let best: { label: string; order: number } | null = null;
  for (const label of labels) {
    const match = /^([A-Za-z]+) (\d{4})$/.exec(label);
    if (!match) continue;
    const index = monthNames.indexOf(match[1]);
    if (index < 0) continue;
    const order = Number(match[2]) * 12 + index;
    if (!best || order > best.order) best = { label, order };
  }
  return best?.label;
};

export const budgetChoices = (
  completeMonths: number
): { options: BudgetWindow[]; defaultWindow: BudgetWindow } => {
  if (completeMonths >= 12) return { options: [3, 6, 12], defaultWindow: 12 };
  if (completeMonths >= 6) return { options: [3, 6], defaultWindow: 6 };
  if (completeMonths >= 3) return { options: [3], defaultWindow: 3 };
  if (completeMonths >= 1) return { options: [1], defaultWindow: 1 };
  return { options: [], defaultWindow: 1 };
};

/** First day of the month after `today` (YYYY-MM-DD), e.g. "November 1, 2026". */
export const budgetUnlockLabel = (today: string) => {
  const [year, month] = today.split('-').map(Number);
  const next = new Date(year, month, 1);
  return `${monthNames[next.getMonth()]} 1, ${next.getFullYear()}`;
};

export interface BudgetCategory {
  id: string;
  label: string;
  average: number;
}

export interface BudgetBaseline {
  months: string[];
  categories: BudgetCategory[];
  spentByCategory: Record<string, number>;
}

export interface BudgetRing {
  id: string;
  label: string;
  spent: number;
  budget: number;
  ratio: number;
}

const monthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`;

/** Completed months that contain expenses, oldest first. The current month is excluded. */
const expenseMonthsBefore = (items: AiItem[], today: string) => {
  const current = today.slice(0, 7);
  return [
    ...new Set(
      items
        .filter((item) => item.kind === 'expense' && item.month < current)
        .map((item) => item.month)
    ),
  ].sort();
};

export const countCompleteExpenseMonths = (items: AiItem[], today: string) =>
  expenseMonthsBefore(items, today).length;

export const buildBudgetBaseline = (
  items: AiItem[],
  today: string,
  windowSize: BudgetWindow
): BudgetBaseline | null => {
  const months = expenseMonthsBefore(items, today).slice(-windowSize);
  if (!months.length) return null;
  const monthSet = new Set(months);
  const [year, month] = today.split('-').map(Number);
  const currentMonth = monthKey(year, month);
  const totals = new Map<string, number>();
  const spentByCategory: Record<string, number> = {};

  for (const item of items) {
    if (item.kind !== 'expense') continue;
    const id = item.cat || '0';
    if (item.month === currentMonth) {
      spentByCategory[id] = (spentByCategory[id] || 0) + item.amount;
    }
    if (monthSet.has(item.month)) {
      totals.set(id, (totals.get(id) || 0) + item.amount);
    }
  }

  const categories = [...totals.entries()]
    .map(([id, total]) => ({
      id,
      label: id === '0' ? 'Uncategorized' : categoryLabel(id) || 'Category',
      average: round(total / months.length),
    }))
    .filter((category) => category.average > 1)
    .sort((a, b) => b.average - a.average || a.label.localeCompare(b.label));

  if (!categories.length) return null;

  return {
    months,
    categories,
    spentByCategory: Object.fromEntries(
      Object.entries(spentByCategory).map(([id, value]) => [id, round(value)])
    ),
  };
};

export const buildBudgets = (baseline: BudgetBaseline): BudgetRing[] =>
  baseline.categories
    .map((category) => {
      const spent = baseline.spentByCategory[category.id] || 0;
      return {
        id: category.id,
        label: category.label,
        spent,
        budget: category.average,
        ratio: spent / category.average,
      };
    })
    .sort((a, b) => b.ratio - a.ratio || b.spent - a.spent);
