import { categories, incomeSuggestions, suggestions } from '../utils/constants';

export const INCOME_TAG_KEY = 'income';
export const TAG_MODE_FIELD = 'field_tag_mode';
export const CUSTOM_TAGS_FIELD = 'field_custom_tags';

const NO_TAGS: string[] = [];

export type TagMode = 'default' | 'custom';
export type TagMap = Record<string, string[]>;

export interface TagCatalog {
  mode: TagMode;
  custom: TagMap;
}

export interface TagGroup {
  key: string;
  label: string;
}

export const emptyCatalog = (): TagCatalog => ({ mode: 'default', custom: {} });

export const tagGroups = (): TagGroup[] => [
  ...categories.filter((category) => category.value).map((category) => ({
    key: category.value,
    label: category.label,
  })),
  { key: INCOME_TAG_KEY, label: 'Income' },
];

/** Built-in list for one category id, or income. Same array every call. */
export const defaultTagsFor = (key: string): string[] => {
  if (key === INCOME_TAG_KEY) return incomeSuggestions;
  const list = (suggestions as Record<string, string[] | undefined>)[key];
  return list ?? NO_TAGS;
};

/** Editable copy of every built-in list, keyed like the Drupal field. */
export const defaultTagMap = (): TagMap => {
  const map: TagMap = {};
  for (const group of tagGroups()) {
    map[group.key] = [...defaultTagsFor(group.key)];
  }
  return map;
};

export const cloneTagMap = (map: TagMap): TagMap => {
  const next: TagMap = {};
  for (const [key, tags] of Object.entries(map)) {
    next[key] = [...tags];
  }
  return next;
};

export const hasAnyTag = (map: TagMap) => Object.values(map).some((tags) => tags.length > 0);

/** The list forms, filters, and the assistant should use right now. */
export const activeTags = (catalog: TagCatalog, key: string): string[] => {
  if (catalog.mode !== 'custom') return defaultTagsFor(key);
  return catalog.custom[key] ?? NO_TAGS;
};

export const catalogSignature = (mode: TagMode, tags: TagMap) =>
  `${mode}|${tagGroups()
    .map((group) => `${group.key}:${(tags[group.key] || []).join('|')}`)
    .join(';')}`;

/**
 * A tag the hashtag parser can round-trip. Colons would break the Drupal
 * `category:tag` value, and commas are not part of a tag.
 */
export const normalizeTag = (input: string): string | null => {
  const tag = input.trim().replace(/^#+/, '').replace(/\s+/g, ' ');
  if (!tag || tag.length > 80) return null;
  if (!/[a-zA-Z0-9]/.test(tag)) return null;
  if (!/^[a-zA-Z0-9/+-]+(?: [a-zA-Z0-9/+-]+)*$/.test(tag)) return null;
  return tag;
};

const sanitizeMap = (value: unknown): TagMap => {
  if (!value || typeof value !== 'object') return {};
  const map: TagMap = {};
  for (const [key, tags] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(tags)) continue;
    const clean = tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (clean.length) map[key] = clean;
  }
  return map;
};

/** Drupal multivalue text: each item is `categoryId:tag` or `income:tag`. */
export const parseCustomTags = (values: unknown): TagMap => {
  if (!Array.isArray(values)) return {};
  const map: TagMap = {};
  for (const item of values) {
    const raw = typeof item === 'string' ? item : String(item?.value || '');
    const separator = raw.indexOf(':');
    if (separator <= 0) continue;
    const key = raw.slice(0, separator).trim();
    const tag = raw.slice(separator + 1).trim();
    if (!key || !tag) continue;
    const list = map[key] || [];
    if (!list.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      list.push(tag);
    }
    map[key] = list;
  }
  return map;
};

export const serializeCustomTags = (map: TagMap): { value: string }[] => {
  const values: { value: string }[] = [];
  for (const group of tagGroups()) {
    for (const tag of map[group.key] || []) {
      const clean = tag.trim();
      if (clean) values.push({ value: `${group.key}:${clean}` });
    }
  }
  return values;
};

export const parseTagMode = (field: unknown): TagMode => {
  const value = Array.isArray(field) ? field[0]?.value : field;
  return value === 'custom' ? 'custom' : 'default';
};

export const catalogFromUser = (user: any): TagCatalog => ({
  mode: parseTagMode(user?.[TAG_MODE_FIELD]),
  custom: parseCustomTags(user?.[CUSTOM_TAGS_FIELD]),
});

const CACHE_PREFIX = 'tagCatalog:';

export const readTagCache = (uid: string): TagCatalog | null => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.mode !== 'default' && parsed?.mode !== 'custom') return null;
    return { mode: parsed.mode, custom: sanitizeMap(parsed.custom) };
  } catch {
    return null;
  }
};

export const writeTagCache = (uid: string, catalog: TagCatalog) => {
  localStorage.setItem(`${CACHE_PREFIX}${uid}`, JSON.stringify(catalog));
};

let logoutHandler = () => {};

export const registerTagLogout = (handler: () => void) => {
  logoutHandler = handler;
};

export const resetTagsOnLogout = () => logoutHandler();
