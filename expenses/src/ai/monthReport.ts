import { monthNames } from '../utils/constants';
import { AI_STORAGE_KEYS } from './config';
import {
  AiItem,
  categoryLabel,
  localToday,
  round,
  sumAmounts,
  visibleDescription,
} from './data';
import { getAiLanguage } from './storage';

export const isMonthKey = (value: string): boolean => /^\d{4}-\d{2}$/.test(value);

export const shiftMonth = (month: string, delta: number) => {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const monthLabelToKey = (label: string): string | null => {
  const match = /^([A-Za-z]+) (\d{4})$/.exec(label);
  if (!match) return null;
  const index = monthNames.indexOf(match[1]);
  if (index < 0) return null;
  return `${match[2]}-${String(index + 1).padStart(2, '0')}`;
};

export const monthKeyLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month || month < 1 || month > 12) return key;
  return `${monthNames[month - 1]} ${year}`;
};

export const currentMonthKey = () => localToday().slice(0, 7);

export const isClosedMonth = (month: string) => isMonthKey(month) && month < currentMonthKey();

export const closedExpenseMonths = (items: AiItem[]): string[] => {
  const current = currentMonthKey();
  const months = new Set<string>();
  for (const item of items) {
    if (item.kind === 'expense' && item.month < current) months.add(item.month);
  }
  return [...months].sort().reverse();
};

export interface CategoryDelta {
  id: string;
  label: string;
  spent: number;
  avg3: number;
  delta: number;
  pct: number | null;
}

export interface ReportExpense {
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface MonthReportFacts {
  month: string;
  label: string;
  spent: number;
  income: number;
  saved: number;
  savingsRate: number | null;
  expenseCount: number;
  avgSpentPrev3: number;
  vsAvg3: number;
  vsAvg3Pct: number | null;
  score: number;
  categories: CategoryDelta[];
  wentWell: CategoryDelta[];
  exploded: CategoryDelta[];
  biggestExpenses: ReportExpense[];
  chart: {
    labels: string[];
    spent: number[];
    average: number[];
  };
  fingerprint: string;
}

export interface MonthReportNarrative {
  headline: string;
  scoreWhy: string;
  wentWell: { label: string; text: string }[];
  exploded: { label: string; text: string }[];
  nextMonth: string;
  joke: string;
}

export interface MonthReportSnapshot {
  month: string;
  fingerprint: string;
  narrative: MonthReportNarrative;
  generatedAt: number;
  source: 'ai' | 'local';
}

interface MonthReportStore {
  viewed: Record<string, true>;
  reports: Record<string, MonthReportSnapshot>;
}

const emptyStore = (): MonthReportStore => ({ viewed: {}, reports: {} });

const readStore = (): MonthReportStore => {
  try {
    const parsed = JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.monthReports) || 'null');
    if (!parsed || typeof parsed !== 'object') return emptyStore();
    return {
      viewed: parsed.viewed && typeof parsed.viewed === 'object' ? parsed.viewed : {},
      reports: parsed.reports && typeof parsed.reports === 'object' ? parsed.reports : {},
    };
  } catch {
    return emptyStore();
  }
};

const writeStore = (store: MonthReportStore) => {
  localStorage.setItem(AI_STORAGE_KEYS.monthReports, JSON.stringify(store));
};

export const isMonthReportViewed = (month: string) => !!readStore().viewed[month];

export const markMonthReportViewed = (month: string) => {
  const store = readStore();
  store.viewed[month] = true;
  writeStore(store);
};

export const getMonthReportSnapshot = (month: string): MonthReportSnapshot | null =>
  readStore().reports[month] || null;

export const saveMonthReportSnapshot = (snapshot: MonthReportSnapshot) => {
  const store = readStore();
  store.reports[snapshot.month] = snapshot;
  writeStore(store);
};

export const clearMonthReportSnapshot = (month: string) => {
  const store = readStore();
  delete store.reports[month];
  writeStore(store);
};

const averageOfPrevious = (items: AiItem[], month: string, count: number) => {
  const firstMonth = items.length ? items[items.length - 1].month : month;
  const months: string[] = [];
  for (let i = 1; i <= count; i++) {
    const previous = shiftMonth(month, -i);
    if (previous >= firstMonth) months.push(previous);
  }
  const perCat = new Map<string, number>();
  let total = 0;
  for (const item of items) {
    if (item.kind === 'expense' && months.includes(item.month)) {
      total += item.amount;
      perCat.set(item.cat, (perCat.get(item.cat) || 0) + item.amount);
    }
  }
  const n = months.length || 1;
  return {
    months: n,
    total: round(total / n),
    perCat: (cat: string) => round((perCat.get(cat) || 0) / n),
  };
};

const scoreFrom = (facts: {
  saved: number;
  savingsRate: number | null;
  vsAvg3Pct: number | null;
  exploded: CategoryDelta[];
}) => {
  let score = 6;
  if (facts.saved > 0) score += 1;
  if (facts.saved < 0) score -= 2;
  if (facts.savingsRate !== null) {
    if (facts.savingsRate >= 20) score += 1;
    if (facts.savingsRate >= 35) score += 1;
    if (facts.savingsRate < 5) score -= 1;
  }
  if (facts.vsAvg3Pct !== null) {
    if (facts.vsAvg3Pct <= -8) score += 1;
    if (facts.vsAvg3Pct >= 10) score -= 1;
    if (facts.vsAvg3Pct >= 25) score -= 1;
  }
  const hot = facts.exploded.filter((c) => (c.pct || 0) >= 40).length;
  score -= Math.min(2, hot);
  return Math.max(1, Math.min(10, score));
};

const money = (value: number) => Math.round(value).toLocaleString('en-US');

export const buildMonthReportFacts = (
  items: AiItem[],
  month: string,
  shareDescriptions: boolean
): MonthReportFacts | null => {
  if (!isMonthKey(month)) return null;
  const inMonth = items.filter((item) => item.month === month);
  const expenses = inMonth.filter((item) => item.kind === 'expense');
  if (!expenses.length) return null;

  const spent = sumAmounts(expenses);
  const income = sumAmounts(inMonth.filter((item) => item.kind === 'income'));
  const saved = round(income - spent);
  const avg3 = averageOfPrevious(items, month, 3);
  const vsAvg3 = round(spent - avg3.total);
  const vsAvg3Pct = avg3.total > 0 ? round((vsAvg3 / avg3.total) * 100, 1) : null;

  const byCat = new Map<string, number>();
  for (const expense of expenses) {
    byCat.set(expense.cat, (byCat.get(expense.cat) || 0) + expense.amount);
  }

  const categories: CategoryDelta[] = [...byCat.entries()]
    .map(([id, total]) => {
      const average = avg3.perCat(id);
      const delta = round(total - average);
      return {
        id,
        label: categoryLabel(id) || 'Uncategorized',
        spent: round(total),
        avg3: average,
        delta,
        pct: average > 0 ? round((delta / average) * 100, 1) : null,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const wentWell = [...categories]
    .filter((c) => c.delta < 0 && c.label !== 'Uncategorized')
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3);
  const exploded = [...categories]
    .filter((c) => c.delta > 0 && c.label !== 'Uncategorized')
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  const chartCats = categories.filter((c) => c.label !== 'Uncategorized').slice(0, 6);
  const savingsRate = income > 0 ? round((saved / income) * 100, 1) : null;
  const factsBase = { saved, savingsRate, vsAvg3Pct, exploded };

  const biggestExpenses = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((item) => ({
      date: item.date,
      amount: round(item.amount),
      category: categoryLabel(item.cat) || 'Uncategorized',
      description: visibleDescription(item.desc, shareDescriptions),
    }));

  const fingerprint = [
    spent,
    income,
    expenses.length,
    ...categories.map((c) => `${c.id}:${c.spent}`),
  ].join('|');

  return {
    month,
    label: monthKeyLabel(month),
    spent,
    income,
    saved,
    savingsRate,
    expenseCount: expenses.length,
    avgSpentPrev3: avg3.total,
    vsAvg3,
    vsAvg3Pct,
    score: scoreFrom(factsBase),
    categories,
    wentWell,
    exploded,
    biggestExpenses,
    chart: {
      labels: chartCats.map((c) => c.label),
      spent: chartCats.map((c) => c.spent),
      average: chartCats.map((c) => c.avg3),
    },
    fingerprint,
  };
};

const pick = (language: string) => language === 'Russian' || language === 'Romanian' || language === 'English' ? language : 'English';

const copy = {
  English: {
    under: (label: string) => `${label} came in under your usual level.`,
    over: (label: string) => `${label} ran hotter than your usual level.`,
    headlineUnder: 'You kept spending under your usual pace.',
    headlineOver: 'Spending ran ahead of your usual pace.',
    headlineFlat: 'A steady month, close to your usual level.',
    scoreSaved: (rate: string) => `Saved ${rate} of income.`,
    scoreOverspent: 'Spent more than came in.',
    scoreFlat: 'Close to breaking even.',
    nextOver: (label: string, extra: string) =>
      `If ${label} returns to its 3-month average, that's about ${extra} extra next month.`,
    nextOk: 'Keep the same pace. Nothing here needs a special plan.',
    jokeUnder: 'The budget held. Try not to celebrate with a receipt.',
    jokeOver: 'The budget survived. Barely, but it survived.',
  },
  Romanian: {
    under: (label: string) => `${label} a ieșit sub nivelul tău obișnuit.`,
    over: (label: string) => `${label} a urcat peste nivelul tău obișnuit.`,
    headlineUnder: 'Ai ținut cheltuielile sub ritmul tău obișnuit.',
    headlineOver: 'Ai cheltuit peste ritmul tău obișnuit.',
    headlineFlat: 'O lună liniștită, aproape de nivelul tău obișnuit.',
    scoreSaved: (rate: string) => `Ai economisit ${rate} din venit.`,
    scoreOverspent: 'Ai cheltuit mai mult decât ai câștigat.',
    scoreFlat: 'Aproape de zero, plus minus.',
    nextOver: (label: string, extra: string) =>
      `Dacă ${label} revine la media ta pe 3 luni, rămân ~${extra} în plus luna viitoare.`,
    nextOk: 'Ține același ritm. Nimic aici nu cere un plan special.',
    jokeUnder: 'Bugetul a ținut. Nu-l sărbători cu un bon.',
    jokeOver: 'Bugetul a rezistat. La limită, dar a rezistat.',
  },
  Russian: {
    under: (label: string) => `${label} вышла ниже обычного уровня.`,
    over: (label: string) => `${label} ушла выше обычного уровня.`,
    headlineUnder: 'Траты остались ниже обычного темпа.',
    headlineOver: 'Траты обогнали обычный темп.',
    headlineFlat: 'Спокойный месяц, близко к обычному уровню.',
    scoreSaved: (rate: string) => `Отложено ${rate} дохода.`,
    scoreOverspent: 'Потрачено больше, чем пришло.',
    scoreFlat: 'Почти в ноль.',
    nextOver: (label: string, extra: string) =>
      `Если ${label} вернётся к средней за 3 месяца, это около ${extra} сверху в следующем месяце.`,
    nextOk: 'Держи тот же темп. Здесь не нужен отдельный план.',
    jokeUnder: 'Бюджет выдержал. Не празднуй это чеком.',
    jokeOver: 'Бюджет выжил. Еле, но выжил.',
  },
};

const storyLine = (
  item: CategoryDelta,
  kind: 'under' | 'over',
  text: (typeof copy)['English']
) => {
  const signed = `${item.delta > 0 ? '+' : ''}${money(item.delta)}`;
  const vs = item.pct === null ? signed : `${signed} (${item.pct > 0 ? '+' : ''}${item.pct}%)`;
  return {
    label: item.label,
    text: `${kind === 'under' ? text.under(item.label) : text.over(item.label)} ${vs}.`,
  };
};

export const buildLocalNarrative = (facts: MonthReportFacts, language = getAiLanguage()): MonthReportNarrative => {
  const text = copy[pick(language)];
  const headline =
    facts.vsAvg3Pct === null || Math.abs(facts.vsAvg3Pct) < 4
      ? text.headlineFlat
      : facts.vsAvg3Pct < 0
        ? text.headlineUnder
        : text.headlineOver;
  const scoreWhy =
    facts.saved < 0
      ? text.scoreOverspent
      : facts.savingsRate !== null
        ? text.scoreSaved(`${Math.round(facts.savingsRate)}%`)
        : text.scoreFlat;
  const topOver = facts.exploded[0];
  const extra = topOver ? money(topOver.delta) : '';
  return {
    headline,
    scoreWhy,
    wentWell: facts.wentWell.map((item) => storyLine(item, 'under', text)),
    exploded: facts.exploded.map((item) => storyLine(item, 'over', text)),
    nextMonth: topOver ? text.nextOver(topOver.label, extra) : text.nextOk,
    joke: facts.vsAvg3Pct !== null && facts.vsAvg3Pct > 8 ? text.jokeOver : text.jokeUnder,
  };
};

export const factsPacketForModel = (facts: MonthReportFacts, currency: string) =>
  JSON.stringify(
    {
      month: facts.label,
      currency,
      spent: facts.spent,
      income: facts.income,
      saved: facts.saved,
      savingsRatePct: facts.savingsRate,
      vs3MonthAveragePct: facts.vsAvg3Pct,
      vs3MonthAverage: facts.vsAvg3,
      avgSpentPrev3: facts.avgSpentPrev3,
      score: facts.score,
      wentWell: facts.wentWell,
      exploded: facts.exploded,
      biggestExpenses: facts.biggestExpenses,
    },
    null,
    2
  );
