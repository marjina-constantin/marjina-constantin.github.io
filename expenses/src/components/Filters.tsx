import React, { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react';
import { categories } from '../utils/constants';
import { useData } from '../context';
import { Search, X } from 'lucide-react';
import { DataState } from '../type/types';

function Filters() {
  const { data, dataDispatch } = useData() as DataState;

  const [state, setState] = useState({
    category: data.category ?? '',
    textFilter: data.textFilter ?? '',
  });
  const [showTextFilter, setShowTextFilter] = useState(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  // Ref to store debounce timeout ID - avoids stale closures and unnecessary re-renders
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to store latest state values for debounce callback
  const stateRef = useRef(state);
  
  // Keep stateRef in sync with state (no re-renders triggered)
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync local state with external state on mount only (avoids cursor jumps while typing)
  // Note: Initial state is already set from data, but this handles edge cases where
  // component mounts before data is loaded
  useEffect(() => {
    const externalCategory = data.category ?? '';
    const externalTextFilter = data.textFilter ?? '';
    const currentCategory = stateRef.current.category;
    const currentTextFilter = stateRef.current.textFilter;
    
    if (externalCategory !== currentCategory || externalTextFilter !== currentTextFilter) {
      setState({
        category: externalCategory,
        textFilter: externalTextFilter,
      });
    }
    // Only sync on mount - don't re-sync on every external change to avoid interrupting typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = mount only

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Debounced dispatch function - uses refs to avoid stale closures
  const debouncedDispatch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      const currentState = stateRef.current;
      dataDispatch({
        type: 'FILTER_DATA',
        category: currentState.category,
        textFilter: currentState.textFilter,
      });
      debounceTimeoutRef.current = null;
    }, 300); // 300ms debounce - good balance between responsiveness and performance
  }, [dataDispatch]);

  const handleCategoryChange = useCallback((
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const category = event.target.value;
    setState((prevState) => ({
      ...prevState,
      category,
    }));
    // Category changes are immediate (dropdown selection, no need to debounce)
    // Cancel any pending text filter debounce and dispatch immediately
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    dataDispatch({
      type: 'FILTER_DATA',
      category,
      textFilter: stateRef.current.textFilter,
    });
  }, [dataDispatch]);

  const handleTextFilterChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const textFilter = event.target.value;
    // Update local state immediately for responsive UI
    setState((prevState) => ({
      ...prevState,
      textFilter,
    }));
    // Debounce the actual dispatch to reducer
    debouncedDispatch();
  }, [debouncedDispatch]);

  const handleClearFilters = useCallback(() => {
    // Cancel any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    setState({
      category: '',
      textFilter: '',
    });
    setShowTextFilter(false);
    // Dispatch immediately when clearing (no debounce needed)
    dataDispatch({
      type: 'FILTER_DATA',
      category: '',
      textFilter: '',
    });
  }, [dataDispatch]);

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
              value={state.textFilter}
              name="textFilter"
              onChange={handleTextFilterChange}
              placeholder="Filter by text"
              className="filters__input"
            />
            <button
              className="filters__close-button"
              onClick={() => {
                // Cancel any pending debounce
                if (debounceTimeoutRef.current) {
                  clearTimeout(debounceTimeoutRef.current);
                  debounceTimeoutRef.current = null;
                }
                setShowTextFilter(false);
                setState((prev) => ({ ...prev, textFilter: '' }));
                // Dispatch immediately when closing (no debounce needed)
                dataDispatch({
                  type: 'FILTER_DATA',
                  category: stateRef.current.category,
                  textFilter: '',
                });
              }}
              aria-label="Close search"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <select
        value={state.category}
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
      {(state.textFilter || state.category) && (
        <button onClick={handleClearFilters} className="filters__clear-button">
          Clear Filters
        </button>
      )}
    </div>
  );
}

export default React.memo(Filters);
