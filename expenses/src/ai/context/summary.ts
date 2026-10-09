import { categories } from '../../utils/constants';
import { extractHashtags } from '../../utils/utils';
import { AI_LIMITS } from '../config';
import { AiItem, localToday, normalizeText } from '../data';

const whole = (value: number) => Math.round(value);

const topCounts = (entries: Map<string, { count: number; total: number }>, limit: number) =>
  [...entries.entries()]
    .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, { count, total }]) => `${key}|${count}|${whole(total)}`);

/**
 * Compact, deterministic overview of the whole history (~2–4k tokens for five
 * years). It is the stable prefix of every chat request, so identical output
 * for identical data keeps Gemini's implicit prompt cache effective.
 */
export const buildDataSummary = (
  items: AiItem[],
  currency: string,
  shareDescriptions: boolean
): string => {
  const months = new Map<string, { spent: number; income: number; cats: Map<string, number> }>();
  const years = new Map<string, { spent: number; income: number }>();
  const recentDescriptions = new Map<string, { count: number; total: number }>();
  const recentTags = new Map<string, { count: number; total: number }>();

  const today = localToday();
  const yearAgo = `${parseInt(today.slice(0, 4)) - 1}${today.slice(4)}`;
  let expenseCount = 0;
  let incomeCount = 0;

  for (const item of items) {
    const month = months.get(item.month) || { spent: 0, income: 0, cats: new Map() };
    const year = years.get(item.date.slice(0, 4)) || { spent: 0, income: 0 };

    if (item.kind === 'income') {
      incomeCount++;
      month.income += item.amount;
      year.income += item.amount;
    } else {
      expenseCount++;
      month.spent += item.amount;
      year.spent += item.amount;
      month.cats.set(item.cat, (month.cats.get(item.cat) || 0) + item.amount);

      if (item.date > yearAgo) {
        if (shareDescriptions && item.search) {
          const key = item.search.replace(/\s*#.*$/, '').trim() || item.search;
          const entry = recentDescriptions.get(key) || { count: 0, total: 0 };
          recentDescriptions.set(key, { count: entry.count + 1, total: entry.total + item.amount });
        }
        for (const tag of extractHashtags(item.desc)) {
          const key = `#${normalizeText(tag)}`;
          const entry = recentTags.get(key) || { count: 0, total: 0 };
          recentTags.set(key, { count: entry.count + 1, total: entry.total + item.amount });
        }
      }
    }
    months.set(item.month, month);
    years.set(item.date.slice(0, 4), year);
  }

  const firstDate = items.length ? items[items.length - 1].date : '-';
  const lines: string[] = [
    `TODAY ${today} | CURRENCY ${currency} | summary amounts rounded to whole units`,
    `CATEGORIES ${categories
      .filter((c) => c.value)
      .map((c) => `${c.value}=${c.label}`)
      .join(' ')}`,
    `HISTORY since ${firstDate} | ${expenseCount} expenses | ${incomeCount} incomes`,
    '',
    'YEARS year|spent|income|saved',
    ...[...years.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([y, v]) => `${y}|${whole(v.spent)}|${whole(v.income)}|${whole(v.income - v.spent)}`),
    '',
    'MONTHS month|spent|income|spent per category id:amount',
    ...[...months.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([m, v]) => {
        const cats = [...v.cats.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([id, total]) => `${id || '?'}:${whole(total)}`)
          .join(' ');
        return `${m}|${whole(v.spent)}|${whole(v.income)}|${cats}`;
      }),
  ];

  if (recentDescriptions.size) {
    lines.push(
      '',
      'TOP EXPENSE DESCRIPTIONS LAST 12 MONTHS description|count|total',
      ...topCounts(recentDescriptions, AI_LIMITS.summaryTopDescriptions)
    );
  }
  if (recentTags.size) {
    lines.push(
      '',
      'TOP HASHTAGS LAST 12 MONTHS tag|count|total',
      ...topCounts(recentTags, 15)
    );
  }

  return lines.join('\n');
};
