import { GeminiFunctionDeclaration } from '../client';

const filterProperties = {
  kind: {
    type: 'string',
    enum: ['expense', 'income', 'all'],
    description: 'Default expense.',
  },
  from: { type: 'string', description: 'Start date YYYY-MM-DD or YYYY-MM, inclusive.' },
  to: { type: 'string', description: 'End date YYYY-MM-DD or YYYY-MM, inclusive.' },
  categories: {
    type: 'array',
    items: { type: 'string' },
    description: 'Category ids from CATEGORIES.',
  },
  text: {
    type: 'string',
    description: 'Case/diacritics-insensitive substring of the description, e.g. "kaufland" or "#lunch".',
  },
  minAmount: { type: 'number' },
  maxAmount: { type: 'number' },
};

const budgetProperties = {
  month: { type: 'string', description: 'YYYY-MM. Default current month.' },
  window: {
    type: 'string',
    enum: ['1', '3', '6', '12', 'all'],
    description: 'Completed months the budget averages, as on Home. Default matches Home.',
  },
  categories: {
    type: 'array',
    items: { type: 'string' },
    description: 'Category ids from CATEGORIES.',
  },
};

export const toolDeclarations: GeminiFunctionDeclaration[] = [
  {
    name: 'aggregate',
    description:
      'Exact totals grouped by a dimension, with optional filters. Prefer this over query_transactions.',
    parameters: {
      type: 'object',
      properties: {
        groupBy: {
          type: 'string',
          enum: ['month', 'year', 'category', 'description', 'hashtag', 'weekday'],
        },
        ...filterProperties,
        sort: { type: 'string', enum: ['total_desc', 'count_desc', 'key_asc', 'key_desc'] },
        limit: { type: 'integer', description: 'Max groups, default 60.' },
      },
      required: ['groupBy'],
    },
  },
  {
    name: 'query_transactions',
    description: 'Individual records matching filters. Use only when single items are needed.',
    parameters: {
      type: 'object',
      properties: {
        ...filterProperties,
        sort: { type: 'string', enum: ['date_desc', 'date_asc', 'amount_desc', 'amount_asc'] },
        limit: { type: 'integer', description: 'Max rows, default 50.' },
      },
    },
  },
  {
    name: 'get_month_summary',
    description:
      'Totals, income, savings, per-category spend vs previous 3/12 month averages, biggest expenses and, for the current month, a projection.',
    parameters: {
      type: 'object',
      properties: { month: { type: 'string', description: 'YYYY-MM' } },
      required: ['month'],
    },
  },
  {
    name: 'compare_periods',
    description: 'Per-category totals for two date ranges with absolute and % change.',
    parameters: {
      type: 'object',
      properties: {
        aFrom: { type: 'string' },
        aTo: { type: 'string' },
        bFrom: { type: 'string' },
        bTo: { type: 'string' },
        kind: { type: 'string', enum: ['expense', 'income'] },
      },
      required: ['aFrom', 'aTo', 'bFrom', 'bTo'],
    },
  },
  {
    name: 'get_budget_status',
    description:
      'Budgets as on Home: per category spent vs budget (average of completed months), left and ok/ahead/over vs the month pace.',
    parameters: { type: 'object', properties: budgetProperties },
  },
  {
    name: 'compare_budget_vs_spend',
    description:
      'Categories over budget and those with the most left. For the current month, also the projected month-end overspend at the current pace.',
    parameters: {
      type: 'object',
      properties: {
        ...budgetProperties,
        limit: { type: 'integer', description: 'Max categories with money left, default 20.' },
      },
    },
  },
  {
    name: 'detect_spend_spikes',
    description:
      'Categories well above their average of previous months and single expenses far above the category median.',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'YYYY-MM. Default current month.' },
        lookbackMonths: { type: 'integer', description: 'Previous months compared, default 12.' },
        minRatio: { type: 'number', description: 'Multiple of the average that counts as a spike, default 1.5.' },
        limit: { type: 'integer', description: 'Max rows per list, default 10.' },
      },
    },
  },
  {
    name: 'get_savings_rate_trend',
    description:
      'Monthly savings rate ((income - expenses) / income), its average and whether it is improving or worsening.',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start month YYYY-MM.' },
        to: { type: 'string', description: 'End month YYYY-MM. Default current month.' },
        months: { type: 'integer', description: 'Months back from to when from is omitted, default 12.' },
      },
    },
  },
  {
    name: 'show_chart',
    description:
      'Renders a chart in the chat from locally computed totals. Call only when the user explicitly asks for a chart or graph. Still write a short commentary. Do not invent chart numbers.',
    parameters: {
      type: 'object',
      properties: {
        chart: {
          type: 'string',
          enum: ['column', 'line', 'pie'],
          description: 'column or line for time/weekday; pie for a breakdown (category or hashtag).',
        },
        groupBy: {
          type: 'string',
          enum: ['month', 'year', 'category', 'hashtag', 'weekday'],
        },
        splitBy: {
          type: 'string',
          enum: ['category'],
          description: 'Optional. On month/year charts, one series per category (max 6).',
        },
        title: { type: 'string', description: 'Short chart title, max 80 characters.' },
        ...filterProperties,
        limit: { type: 'integer', description: 'Max groups. Default 12, max 24 (8 for pie).' },
      },
      required: ['chart', 'groupBy'],
    },
  },
];
