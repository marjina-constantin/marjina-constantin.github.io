import { TransactionOrIncomeItem } from '../types/types';
import { categories } from '../utils/constants';
import { extractHashtags } from '../utils/utils';

export interface AiItem {
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  amount: number;
  kind: 'expense' | 'income';
  cat: string;
  desc: string;
  /** Lowercased, diacritics-free description used for matching only. */
  search: string;
}

export const categoryLabel = (id: string) =>
  categories.find((c) => c.value === id)?.label || '';

export const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const cache = new WeakMap<TransactionOrIncomeItem[], AiItem[]>();

/** Normalized, newest-first items. Memoized per `raw` array (it is replaced on every sync). */
export const getAiItems = (raw: TransactionOrIncomeItem[]): AiItem[] => {
  const cached = cache.get(raw);
  if (cached) return cached;
  const items = raw
    .filter((item) => item.type === 'transaction' || item.type === 'incomes')
    .map((item) => {
      const date = (item.dt || '').slice(0, 10);
      const desc = (item.dsc || '').trim();
      return {
        date,
        month: date.slice(0, 7),
        amount: parseFloat(item.sum) || 0,
        kind: item.type === 'incomes' ? 'income' : 'expense',
        cat: item.type === 'incomes' ? '' : item.cat || '',
        desc,
        search: normalizeText(desc),
      } as AiItem;
    })
    .filter((item) => item.date.length === 10)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  cache.set(raw, items);
  return items;
};

/** Description as shown to the model: full text, or only hashtags when sharing is off. */
export const visibleDescription = (desc: string, shareDescriptions: boolean) =>
  shareDescriptions
    ? desc.replace(/\|/g, '/').replace(/\s+/g, ' ')
    : extractHashtags(desc).map((tag) => `#${tag}`).join(' ');

export const round = (value: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const localToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const sumAmounts = (items: AiItem[]) => round(items.reduce((sum, i) => sum + i.amount, 0));
