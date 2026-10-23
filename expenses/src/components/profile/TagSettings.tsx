import React, { useMemo, useState } from 'react';
import { Hash, X } from 'lucide-react';
import { useNotification } from '../../context';
import { notificationType } from '../../utils/constants';
import { ButtonSpinner } from '../ui/LoadingSpinner';
import {
  TagCatalog,
  TagMap,
  TagMode,
  catalogSignature,
  cloneTagMap,
  defaultTagMap,
  hasAnyTag,
  normalizeTag,
  tagGroups,
} from '../../tags/catalog';
import { saveTagCatalog, useTagCatalogState } from '../../tags/store';

const TagEditor = ({ initial }: { initial: TagCatalog }) => {
  const showNotification = useNotification();
  const groups = useMemo(() => tagGroups(), []);
  const [draftMode, setDraftMode] = useState<TagMode>(initial.mode);
  const [draftTags, setDraftTags] = useState<TagMap>(() => cloneTagMap(initial.custom));
  const [baseline, setBaseline] = useState(() => catalogSignature(initial.mode, initial.custom));
  const [group, setGroup] = useState('3');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const dirty = catalogSignature(draftMode, draftTags) !== baseline;
  const tags = draftTags[group] || [];

  const selectMode = (mode: TagMode) => {
    setDraftMode(mode);
    if (mode === 'custom' && !hasAnyTag(draftTags)) {
      setDraftTags(defaultTagMap());
    }
  };

  const removeTag = (tag: string) => {
    setDraftTags((current) => ({
      ...current,
      [group]: (current[group] || []).filter((item) => item !== tag),
    }));
  };

  const addTag = (event: React.FormEvent) => {
    event.preventDefault();
    const tag = normalizeTag(input);
    if (!tag) {
      setError('Use letters, numbers, and spaces.');
      return;
    }
    if (tags.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      setError('Already in this list.');
      return;
    }
    setDraftTags((current) => ({
      ...current,
      [group]: [...(current[group] || []), tag],
    }));
    setInput('');
    setError('');
  };

  const save = async () => {
    setBusy(true);
    try {
      const saved = await saveTagCatalog({ mode: draftMode, custom: draftTags });
      setDraftMode(saved.mode);
      setDraftTags(cloneTagMap(saved.custom));
      setBaseline(catalogSignature(saved.mode, saved.custom));
      showNotification('Tags saved.', notificationType.SUCCESS);
    } catch {
      showNotification("Couldn't save your tags. Try again.", notificationType.ERROR);
    }
    setBusy(false);
  };

  return (
    <>
      <div className="tag-settings__modes" role="group" aria-label="Tag source">
        <button
          type="button"
          className={draftMode === 'default' ? 'is-active' : ''}
          onClick={() => selectMode('default')}
          aria-pressed={draftMode === 'default'}
        >
          Default
        </button>
        <button
          type="button"
          className={draftMode === 'custom' ? 'is-active' : ''}
          onClick={() => selectMode('custom')}
          aria-pressed={draftMode === 'custom'}
        >
          Custom
        </button>
      </div>
      <p className="tag-settings__hint">
        {draftMode === 'custom'
          ? 'Your list replaces the built-in suggestions when you add, edit, or filter.'
          : 'Built-in suggestions for each category and for income. Custom keeps your own list.'}
      </p>
      {draftMode === 'custom' && (
        <>
          <select
            className="tag-settings__select"
            value={group}
            aria-label="Category"
            onChange={(event) => {
              setGroup(event.target.value);
              setError('');
            }}
          >
            {groups.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
                {(draftTags[item.key] || []).length ? ` · ${(draftTags[item.key] || []).length}` : ''}
              </option>
            ))}
          </select>
          {tags.length ? (
            <div className="tag-settings__chips">
              {tags.map((tag) => (
                <span key={tag} className="tag-settings__chip">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="tag-settings__hint">No tags for this one yet.</p>
          )}
          <form className="tag-settings__add" onSubmit={addTag}>
            <input
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (error) setError('');
              }}
              placeholder="Add a tag"
              aria-label="New tag"
              maxLength={80}
              disabled={busy}
            />
            <button type="submit" className="button-secondary" disabled={busy || !input.trim()}>
              Add
            </button>
          </form>
          {error && <p className="tag-settings__error">{error}</p>}
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              setDraftTags(defaultTagMap());
              setError('');
            }}
            disabled={busy}
          >
            Restore built-in tags
          </button>
        </>
      )}
      {dirty && (
        <button type="button" className="button" onClick={save} disabled={busy}>
          {busy ? <ButtonSpinner /> : 'Save tags'}
        </button>
      )}
    </>
  );
};

const TagSettings = () => {
  const { catalog, status } = useTagCatalogState();

  return (
    <section className="tag-settings">
      <div className="tag-settings__title">
        <Hash size={16} />
        Tags
      </div>
      {status === 'ready' ? (
        <TagEditor initial={catalog} />
      ) : (
        <p className="tag-settings__hint">Loading your tags…</p>
      )}
    </section>
  );
};

export default TagSettings;
