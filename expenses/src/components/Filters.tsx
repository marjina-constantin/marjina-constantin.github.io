import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { categories } from '../utils/constants';
import { useData } from '../context';
import { Search, X } from 'lucide-react';
import { DataState } from '../type/types';

function Filters() {
  const { data, dataDispatch } = useData() as DataState;

  // Keep filter inputs as local state for responsiveness (especially under fast typing / ctrl+a)
  // and dispatch FILTER_DATA from an effect using the latest values (avoids stale closures).
  const [category, setCategory] = useState(data.category ?? '');
  const [textFilter, setTextFilter] = useState(data.textFilter ?? '');
  const [showTextFilter, setShowTextFilter] = useState(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  // Keep UI consistent: if text filter is active, keep the input visible.
  useEffect(() => {
    if (textFilter && !showTextFilter) {
      setShowTextFilter(true);
    }
  }, [textFilter, showTextFilter]);

  // Sync local state if something external changes filter state (e.g. rehydration / refresh).
  // Only update when values diverge, to avoid cursor-jumps while typing.
  useEffect(() => {
    const nextCategory = data.category ?? '';
    const nextText = data.textFilter ?? '';
    if (nextCategory !== category) setCategory(nextCategory);
    if (nextText !== textFilter) setTextFilter(nextText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.category, data.textFilter]);

  // Debounced dispatch to avoid hammering the reducer on every keypress.
  useEffect(() => {
    if (data.loading || !data.raw) return;
    const handle = window.setTimeout(() => {
      dataDispatch({
        type: 'FILTER_DATA',
        category,
        textFilter,
      });
    }, 80);
    return () => window.clearTimeout(handle);
  }, [category, textFilter, dataDispatch, data.loading, data.raw]);

  const handleCategoryChange = useCallback((
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCategory(event.target.value);
  }, []);

  const handleTextFilterChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTextFilter(event.target.value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setCategory('');
    setTextFilter('');
    setShowTextFilter(false);
  }, []);

  useLayoutEffect(() => {
    if (showTextFilter && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [showTextFilter]);

  return (
    <div className="filters">
      <div className="filters__search">
        {!showTextFilter ? (
          <button
            className="filters__search-button"
            onClick={() => setShowTextFilter(true)}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        ) : (
          <div className="filters__search-input-wrapper">
            <Search size={18} className="filters__search-icon" />
            <input
              ref={textInputRef}
              type="text"
              value={textFilter}
              name="textFilter"
              onChange={handleTextFilterChange}
              placeholder="Filter by text"
              className="filters__input"
            />
            <button
              className="filters__close-button"
              onClick={() => {
                setShowTextFilter(false);
                setTextFilter('');
              }}
              aria-label="Close search"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <select
        value={category}
        name="category"
        onChange={handleCategoryChange}
        className="filters__select"
      >
        {categories.map((category, id) => (
          <option key={id} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>
      {(textFilter || category) && (
        <button onClick={handleClearFilters} className="filters__clear-button">
          Clear Filters
        </button>
      )}
    </div>
  );
}

export default React.memo(Filters);
