import { incomeSuggestions } from '../../utils/constants';
import { hasTag } from '../../utils/utils';
import { AiItem, categoryLabel, localToday, round } from '../data';
import { executeTool } from '../tools/executors';

export interface InsightInput {
  /** Every expense and income, newest first. */
  all: AiItem[];
  /** Expenses with the Home/Charts filters applied. */
  expenses: AiItem[];
  /** Incomes with the Income page filters applied. */
  incomes: AiItem[];
  expenseFilter: string;
  incomeFilter: string;
  currency: string;
  share: boolean;
}

export type InsightBuilder = (input: InsightInput, param?: string) => string | null;

const whole = Math.round;
const DAYS_PER_MONTH = 30.42;

const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const daysBetween = (from: string, to: string) =>
  Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1);

const monthEnd = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const end = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
  const today = localToday();
  return end > today ? today : end;
};

const pct = (part: number, total: number) => (total ? round((part / total) * 100, 1) : 0);
const change = (from: number, to: number) => (from ? `${round(((to - from) / from) * 100, 1)}%` : 'n/a');
const sum = (items: AiItem[]) => items.reduce((total, i) => total + i.amount, 0);

const header = (input: InsightInput, filter: string) =>
  `TODAY ${localToday()} | CURRENCY ${input.currency}${filter ? ` | ACTIVE FILTER: ${filter}` : ''}`;

const keyValues = (values: Record<string, unknown>) =>
  Object.entries(values)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => (String(v).includes('\n') ? `${k}:\n${v}` : `${k}: ${v}`))
    .join('\n');

interface MonthTotals {
  month: string;
  spent: number;
  income: number;
  cats: Map<string, number>;
}

/** Ascending months from the first to the last record, gaps filled with zeros. */
const byMonth = (items: AiItem[]): MonthTotals[] => {
  if (!items.length) return [];
  const map = new Map<string, MonthTotals>();
  for (const item of items) {
    const entry = map.get(item.month) || { month: item.month, spent: 0, income: 0, cats: new Map() };
    if (item.kind === 'income') {
      entry.income += item.amount;
    } else {
      entry.spent += item.amount;
      entry.cats.set(item.cat, (entry.cats.get(item.cat) || 0) + item.amount);
    }
    map.set(item.month, entry);
  }
  const result: MonthTotals[] = [];
  const last = items[0].month;
  for (let m = items[items.length - 1].month; m <= last; m = shiftMonth(m, 1)) {
    result.push(map.get(m) || { month: m, spent: 0, income: 0, cats: new Map() });
  }
  return result;
};

const byKey = (items: AiItem[], keyOf: (item: AiItem) => string) => {
  const map = new Map<string, number>();
  for (const item of items) map.set(keyOf(item), (map.get(keyOf(item)) || 0) + item.amount);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
};

const catName = (item: AiItem) => categoryLabel(item.cat) || 'Uncategorized';

const incomeSource = (item: AiItem, share: boolean) => {
  const tag = incomeSuggestions.find((t) => hasTag(item.desc, t));
  if (tag) return tag;
  if (share && item.search) return item.search.replace(/\s*#.*$/, '').trim() || 'untagged';
  return 'untagged';
};

const startDate = (input: InsightInput) =>
  input.all.length ? input.all[input.all.length - 1].date : localToday();

const scopedItems = (input: InsightInput) => (input.expenseFilter ? input.expenses : input.all);

const topDescriptions = (input: InsightInput, items: AiItem[], from?: string, to?: string, limit = 10) => {
  if (!input.share) return [];
  const result = executeTool(
    'aggregate',
    { groupBy: 'description', from, to, limit },
    { items, shareDescriptions: true }
  ) as { rows?: string };
  return result.rows ? ['', 'TOP DESCRIPTIONS description|total|count|average', result.rows] : [];
};

// --- Home ---------------------------------------------------------------

export const buildMonthInsight: InsightBuilder = (input, month) => {
  if (!month) return null;
  const items = scopedItems(input);
  const summary = executeTool('get_month_summary', { month }, { items, shareDescriptions: input.share });
  if (!summary.expenseCount && !summary.income) return null;
  if (input.expenseFilter) {
    delete summary.income;
    delete summary.saved;
  }
  const previous = byMonth(items).filter((m) => m.month < month).slice(-6);
  return [
    header(input, input.expenseFilter),
    '',
    'MONTH',
    keyValues(summary),
    '',
    'PREVIOUS 6 MONTHS month|spent|income',
    ...previous.map((m) => `${m.month}|${whole(m.spent)}|${whole(m.income)}`),
    ...topDescriptions(input, items, month, month, 8),
  ].join('\n');
};

export const buildAllTimeInsight: InsightBuilder = (input) => {
  const items = scopedItems(input);
  if (!items.length) return null;
  const months = byMonth(items);
  const years = [...new Set(months.map((m) => m.month.slice(0, 4)))];
  const yearRows = years.map((year) => {
    const ms = months.filter((m) => m.month.startsWith(year));
    const spent = ms.reduce((t, m) => t + m.spent, 0);
    const income = ms.reduce((t, m) => t + m.income, 0);
    return input.expenseFilter
      ? `${year}|${whole(spent)}|${ms.length}`
      : `${year}|${whole(spent)}|${whole(income)}|${whole(income - spent)}|${pct(income - spent, income)}%|${ms.length}`;
  });

  const expenses = items.filter((i) => i.kind === 'expense');
  const catRows = byKey(expenses, catName).map(([cat]) => {
    const perYear = years.map((year) =>
      whole(sum(expenses.filter((e) => catName(e) === cat && e.date.startsWith(year))))
    );
    return `${cat}|${perYear.join('|')}`;
  });

  const full = months.slice(0, -1);
  const avg = (list: MonthTotals[]) => whole(list.reduce((t, m) => t + m.spent, 0) / (list.length || 1));

  return [
    header(input, input.expenseFilter),
    `HISTORY since ${startDate(input)} | ${months.length} months (current month partial)`,
    '',
    input.expenseFilter ? 'YEARS year|spent|months' : 'YEARS year|spent|income|saved|savings rate|months',
    ...yearRows,
    '',
    `SPENT PER CATEGORY BY YEAR category|${years.join('|')}`,
    ...catRows,
    '',
    `AVERAGE MONTHLY SPENT all full months: ${avg(full)} | last 12 full months: ${avg(full.slice(-12))} | last 3 full months: ${avg(full.slice(-3))}`,
    'MONTHLY SPENT LAST 24 MONTHS',
    months.slice(-24).map((m) => `${m.month}:${whole(m.spent)}`).join(' '),
    ...topDescriptions(input, expenses, undefined, undefined, 15),
  ].join('\n');
};

// --- Income ---------------------------------------------------------------

const allExpenses = (input: InsightInput) => input.all.filter((i) => i.kind === 'expense');

export const buildIncomeMonthInsight: InsightBuilder = (input) => {
  const month = localToday().slice(0, 7);
  const incomes = input.incomes;
  const expenses = allExpenses(input);
  const monthIncome = incomes.filter((i) => i.month === month);
  const previousMonths = Array.from({ length: 12 }, (_, i) => shiftMonth(month, -(i + 1))).reverse();
  const totalsFor = (m: string) => {
    const income = sum(incomes.filter((i) => i.month === m));
    const spent = sum(expenses.filter((e) => e.month === m));
    return { income, spent };
  };
  const previous = previousMonths.map((m) => ({ month: m, ...totalsFor(m) })).filter((m) => m.income || m.spent);
  if (!monthIncome.length && !previous.some((m) => m.income)) return null;

  const current = totalsFor(month);
  const avgIncome = previous.reduce((t, m) => t + m.income, 0) / (previous.length || 1);
  const avgSpent = previous.reduce((t, m) => t + m.spent, 0) / (previous.length || 1);
  const day = parseInt(localToday().slice(8, 10));

  return [
    header(input, input.incomeFilter),
    '',
    `MONTH ${month} (day ${day} of the month)`,
    keyValues({
      income: whole(current.income),
      incomeRecords: monthIncome.length,
      spent: input.incomeFilter ? undefined : whole(current.spent),
      saved: input.incomeFilter ? undefined : whole(current.income - current.spent),
      savingsRate: input.incomeFilter ? undefined : `${pct(current.income - current.spent, current.income)}%`,
    }),
    'SOURCES THIS MONTH source|total',
    ...byKey(monthIncome, (i) => incomeSource(i, input.share)).map(([s, t]) => `${s}|${whole(t)}`),
    '',
    `PREVIOUS 12 MONTHS AVERAGE income: ${whole(avgIncome)} | spent: ${whole(avgSpent)} | savings rate: ${pct(avgIncome - avgSpent, avgIncome)}%`,
    'PREVIOUS MONTHS month|income|spent|saved',
    ...previous.slice(-6).map((m) => `${m.month}|${whole(m.income)}|${whole(m.spent)}|${whole(m.income - m.spent)}`),
  ].join('\n');
};

const deficitMonths = (months: MonthTotals[]) => {
  const deficits = months.filter((m) => m.spent > m.income);
  const worst = [...deficits]
    .sort((a, b) => a.income - a.spent - (b.income - b.spent))
    .slice(0, 6)
    .map((m) => `${m.month}(${whole(m.income - m.spent)})`);
  return deficits.length
    ? `DEFICIT MONTHS LAST ${months.length} (spent > income): ${deficits.length} | worst: ${worst.join(' ')}`
    : `DEFICIT MONTHS LAST ${months.length}: none`;
};

export const buildIncomeAllInsight: InsightBuilder = (input) => {
  const incomes = input.incomes;
  if (!incomes.length) return null;
  const expenses = allExpenses(input);
  const months = byMonth([...incomes, ...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)));
  const years = [...new Set(months.map((m) => m.month.slice(0, 4)))];
  const full = months.slice(0, -1);
  const last12 = full.slice(-12).map((m) => m.income);
  const mean = last12.reduce((t, v) => t + v, 0) / (last12.length || 1);
  const stdev = Math.sqrt(last12.reduce((t, v) => t + (v - mean) ** 2, 0) / (last12.length || 1));
  const yearAgo = shiftMonth(localToday().slice(0, 7), -12);

  const sources = (list: AiItem[]) => {
    const total = sum(list);
    return byKey(list, (i) => incomeSource(i, input.share))
      .slice(0, 10)
      .map(([s, t]) => `${s}|${whole(t)}|${pct(t, total)}%`);
  };

  return [
    header(input, input.incomeFilter),
    `HISTORY since ${startDate(input)}`,
    '',
    'YEARS year|income|spent|saved|savings rate',
    ...years.map((year) => {
      const ms = months.filter((m) => m.month.startsWith(year));
      const income = ms.reduce((t, m) => t + m.income, 0);
      const spent = ms.reduce((t, m) => t + m.spent, 0);
      return `${year}|${whole(income)}|${whole(spent)}|${whole(income - spent)}|${pct(income - spent, income)}%`;
    }),
    '',
    `LAST 12 FULL MONTHS income avg: ${whole(mean)} | stdev: ${whole(stdev)} | min: ${whole(Math.min(...last12))} | max: ${whole(Math.max(...last12))}`,
    'MONTHLY INCOME LAST 24 MONTHS',
    months.slice(-24).map((m) => `${m.month}:${whole(m.income)}`).join(' '),
    deficitMonths(months.slice(-24)),
    '',
    'SOURCES ALL TIME source|total|share',
    ...sources(incomes),
    'SOURCES LAST 12 MONTHS source|total|share',
    ...sources(incomes.filter((i) => i.month > yearAgo)),
  ].join('\n');
};

// --- Charts ---------------------------------------------------------------

const cumulative = (items: AiItem[], start: string) => {
  let spent = 0;
  let income = 0;
  return byMonth(items).map((m) => {
    spent += m.spent;
    income += m.income;
    return { month: m.month, spent, income, days: daysBetween(start, monthEnd(m.month)) };
  });
};

export const buildMonthlyTotalsInsight: InsightBuilder = (input) => {
  const items = scopedItems(input);
  if (!items.length) return null;
  const months = byMonth(items);
  const total = sum(items.filter((i) => i.kind === 'expense'));
  const average = total / (daysBetween(startDate(input), localToday()) / DAYS_PER_MONTH);
  const full = [...months.slice(0, -1)].sort((a, b) => b.spent - a.spent);
  return [
    header(input, input.expenseFilter),
    'CHART Monthly totals: a column per month of total spent, dotted line = average per month, optional income line.',
    `AVERAGE PER MONTH ${whole(average)}`,
    `HIGHEST MONTHS ${full.slice(0, 3).map((m) => `${m.month}:${whole(m.spent)}`).join(' ')}`,
    `LOWEST MONTHS ${full.slice(-3).map((m) => `${m.month}:${whole(m.spent)}`).join(' ')}`,
    '',
    input.expenseFilter ? 'MONTHS month|spent' : 'MONTHS month|spent|income',
    ...months.map((m) =>
      input.expenseFilter ? `${m.month}|${whole(m.spent)}` : `${m.month}|${whole(m.spent)}|${whole(m.income)}`
    ),
  ].join('\n');
};

export const buildYearsInReviewInsight: InsightBuilder = (input) => {
  const months = byMonth(input.expenses);
  if (!months.length) return null;
  const years = [...new Set(months.map((m) => m.month.slice(0, 4)))];
  return [
    header(input, input.expenseFilter),
    'CHART Years in review: one line per year, x axis Jan..Dec, y = spent per month.',
    '',
    'SPENT year|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|total|months with data',
    ...years.map((year) => {
      const values = Array.from({ length: 12 }, (_, i) => {
        const m = months.find((x) => x.month === `${year}-${String(i + 1).padStart(2, '0')}`);
        return m ? whole(m.spent) : '-';
      });
      const ms = months.filter((m) => m.month.startsWith(year));
      return `${year}|${values.join('|')}|${whole(ms.reduce((t, m) => t + m.spent, 0))}|${ms.length}`;
    }),
  ].join('\n');
};

const categoryWindows = (expenses: AiItem[]) => {
  const thisMonth = localToday().slice(0, 7);
  const last12From = shiftMonth(thisMonth, -12);
  const prev12From = shiftMonth(thisMonth, -24);
  return byKey(expenses, catName).map(([cat, total]) => {
    const own = expenses.filter((e) => catName(e) === cat);
    const last12 = sum(own.filter((e) => e.month >= last12From && e.month < thisMonth));
    const prev12 = sum(own.filter((e) => e.month >= prev12From && e.month < last12From));
    return { cat, total, last12, prev12 };
  });
};

export const buildAllTimeSpendingsInsight: InsightBuilder = (input) => {
  const expenses = input.expenses;
  if (!expenses.length) return null;
  const total = sum(expenses);
  return [
    header(input, input.expenseFilter),
    `CHART All time spendings: pie of total spent per category since ${startDate(input)}.`,
    `TOTAL ${whole(total)}`,
    '',
    'CATEGORIES category|total|share|last 12 full months|previous 12 months|change',
    ...categoryWindows(expenses).map(
      (c) => `${c.cat}|${whole(c.total)}|${pct(c.total, total)}%|${whole(c.last12)}|${whole(c.prev12)}|${change(c.prev12, c.last12)}`
    ),
  ].join('\n');
};

export const buildMonthlyAverageInsight: InsightBuilder = (input) => {
  const expenses = input.all.filter((i) => i.kind === 'expense');
  if (!expenses.length) return null;
  const monthsPassed = daysBetween(startDate(input), localToday()) / DAYS_PER_MONTH;
  const incomeTotal = sum(input.all.filter((i) => i.kind === 'income'));
  return [
    header(input, ''),
    'TABLE Monthly average per category: all-time total / months since first record.',
    `OVERALL ${whole(sum(expenses) / monthsPassed)} per month | average income ${whole(incomeTotal / monthsPassed)} per month`,
    '',
    'CATEGORIES category|all-time avg per month|avg last 12 full months|avg previous 12 months',
    ...categoryWindows(expenses).map(
      (c) => `${c.cat}|${whole(c.total / monthsPassed)}|${whole(c.last12 / 12)}|${whole(c.prev12 / 12)}`
    ),
  ].join('\n');
};

export const buildMonthlyAverageTrendInsight: InsightBuilder = (input) => {
  const items = scopedItems(input);
  if (!items.length) return null;
  const rows = cumulative(items, startDate(input)).map((p) => {
    const avg = p.spent / (p.days / DAYS_PER_MONTH);
    const remaining = avg > 0 ? (p.income - p.spent) / avg : 0;
    return input.expenseFilter
      ? `${p.month}|${whole(avg)}`
      : `${p.month}|${whole(avg)}|${round(remaining, 1)}`;
  });
  return [
    header(input, input.expenseFilter),
    'CHART Monthly average trend: running average of monthly spending since the first record, plus "months remaining" = cumulative savings / running monthly average (how long savings would last without income).',
    '',
    input.expenseFilter ? 'POINTS month|running monthly avg' : 'POINTS month|running monthly avg|months remaining',
    ...(rows.length > 36 ? [rows[0], '...', ...rows.slice(-36)] : rows),
  ].join('\n');
};

export const buildSavingsHistoryInsight: InsightBuilder = (input) => {
  if (!input.all.some((i) => i.kind === 'income')) return null;
  const points = cumulative(input.all, startDate(input));
  const months = byMonth(input.all);
  const years = [...new Set(months.map((m) => m.month.slice(0, 4)))];
  return [
    header(input, ''),
    'CHART Savings history: cumulative savings rate since the first record = (1 - total spent / total income) * 100.',
    '',
    'POINTS month|cumulative savings rate',
    ...points.map((p) => `${p.month}|${pct(p.income - p.spent, p.income)}%`),
    '',
    'YEARLY SAVINGS RATE year|rate',
    ...years.map((year) => {
      const ms = months.filter((m) => m.month.startsWith(year));
      const income = ms.reduce((t, m) => t + m.income, 0);
      const spent = ms.reduce((t, m) => t + m.spent, 0);
      return `${year}|${pct(income - spent, income)}%`;
    }),
  ].join('\n');
};

export const buildDailyAverageInsight: InsightBuilder = (input) => {
  const expenses = input.all.filter((i) => i.kind === 'expense');
  if (!expenses.length) return null;
  const days = daysBetween(startDate(input), localToday());
  const from30 = new Date(Date.parse(localToday()) - 29 * 86400000).toISOString().slice(0, 10);
  const recent = expenses.filter((e) => e.date >= from30);
  const recentByCat = new Map(byKey(recent, catName));
  return [
    header(input, ''),
    'TABLE Daily average per category: all-time total / days since first record.',
    `OVERALL ${round(sum(expenses) / days)} per day | last 30 days ${round(sum(recent) / 30)} per day`,
    '',
    'CATEGORIES category|all-time per day|last 30 days per day',
    ...byKey(expenses, catName).map(
      ([cat, total]) => `${cat}|${round(total / days)}|${round((recentByCat.get(cat) || 0) / 30)}`
    ),
  ].join('\n');
};

export const buildDailyAverageTrendInsight: InsightBuilder = (input) => {
  const items = scopedItems(input);
  if (!items.length) return null;
  const rows = cumulative(items, startDate(input)).map((p) =>
    input.expenseFilter
      ? `${p.month}|${round(p.spent / p.days)}`
      : `${p.month}|${round(p.spent / p.days)}|${round(p.income / p.days)}`
  );
  return [
    header(input, input.expenseFilter),
    'CHART Daily average trends: running daily average of expenses (and incomes) since the first record.',
    '',
    input.expenseFilter ? 'POINTS month|expenses per day' : 'POINTS month|expenses per day|incomes per day',
    ...(rows.length > 36 ? [rows[0], '...', ...rows.slice(-36)] : rows),
  ].join('\n');
};

export const buildIncomeSourcesInsight: InsightBuilder = (input) => {
  const incomes = input.incomes;
  if (!incomes.length) return null;
  const total = sum(incomes);
  const years = [...new Set(incomes.map((i) => i.date.slice(0, 4)))].sort();
  const sources = byKey(incomes, (i) => incomeSource(i, input.share)).slice(0, 8);
  return [
    header(input, input.incomeFilter),
    'CHART Income sources: pie of income per source (by hashtag) and a line per source by month.',
    `TOTAL ${whole(total)}`,
    '',
    `SOURCES source|total|share|${years.join('|')}`,
    ...sources.map(([source, t]) => {
      const perYear = years.map((year) =>
        whole(sum(incomes.filter((i) => i.date.startsWith(year) && incomeSource(i, input.share) === source)))
      );
      return `${source}|${whole(t)}|${pct(t, total)}%|${perYear.join('|')}`;
    }),
  ].join('\n');
};

export const buildYearIncomeInsight: InsightBuilder = (input) => {
  const incomes = input.incomes;
  if (!incomes.length) return null;
  const expenses = allExpenses(input);
  const years = [...new Set(incomes.map((i) => i.date.slice(0, 4)))].sort();
  let previous: { income: number; spent: number } | null = null;
  const rows = years.map((year) => {
    const income = sum(incomes.filter((i) => i.date.startsWith(year)));
    const spent = sum(expenses.filter((e) => e.date.startsWith(year)));
    const row = input.incomeFilter
      ? `${year}|${whole(income)}|${previous ? change(previous.income, income) : 'n/a'}`
      : `${year}|${whole(income)}|${whole(spent)}|${whole(income - spent)}|${pct(income - spent, income)}%|${
          previous ? change(previous.income, income) : 'n/a'
        }|${previous ? change(previous.spent, spent) : 'n/a'}`;
    previous = { income, spent };
    return row;
  });
  return [
    header(input, input.incomeFilter),
    'CHART Years in review (income): income per month for each year, plus a yearly table.',
    '',
    input.incomeFilter
      ? 'YEARS year|income|income change'
      : 'YEARS year|income|spent|saved|savings rate|income change|spent change',
    ...rows,
  ].join('\n');
};
