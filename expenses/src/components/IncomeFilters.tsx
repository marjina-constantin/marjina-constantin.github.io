import React, { useRef, useState, useCallback } from 'react';
import { incomeSuggestions } from '../utils/constants';
import { useData } from '../context';
import { Search, X } from 'lucide-react';
import { DataState } from '../type/types';

function IncomeFilters() {
  const { data, dataDispatch } = useData() as DataState;

  const [state, setState] = useState({
    textFilter: data.incomeTextFilter || '',
    selectedTags: (data.incomeSelectedTags || []) as string[],
  });
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const tagsContainerRef = useRef<HTMLDivElement | null>(null);

  const handleTextFilterChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const textFilter = event.target.value;
    setState((prevState) => ({
      ...prevState,
      textFilter,
    }));
    dataDispatch({
      type: 'FILTER_INCOME_DATA',
      textFilter,
      selectedTags: state.selectedTags,
    });
  }, [dataDispatch, state.selectedTags]);

  const handleTagClick = useCallback((tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newSelectedTags = state.selectedTags.includes(tag)
      ? state.selectedTags.filter(t => t !== tag)
      : [...state.selectedTags, tag];
    
    setState((prevState) => ({
      ...prevState,
      selectedTags: newSelectedTags,
    }));
    
    dataDispatch({
      type: 'FILTER_INCOME_DATA',
      textFilter: state.textFilter,
      selectedTags: newSelectedTags,
    });
    
    // Keep focus on input to prevent tags from disappearing
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [dataDispatch, state.textFilter, state.selectedTags]);

  const handleClearFilters = useCallback(() => {
    setState({
      textFilter: '',
      selectedTags: [],
    });
    setIsFocused(false);
    if (textInputRef.current) {
      textInputRef.current.blur();
    }
    dataDispatch({
      type: 'FILTER_INCOME_DATA',
      textFilter: '',
      selectedTags: [],
    });
  }, [dataDispatch]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Don't hide tags if clicking on tags container
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (tagsContainerRef.current && tagsContainerRef.current.contains(relatedTarget)) {
      return;
    }
    // Keep tags visible if filters are active
    if (state.textFilter || state.selectedTags.length > 0) {
      return;
    }
    setIsFocused(false);
  }, [state.textFilter, state.selectedTags.length]);

  return (
    <div className="filters income-filters">
      <div className="income-filters__top-row">
        <div className="filters__search filters__search--always-open">
          <div className="filters__search-input-wrapper">
            <Search size={18} className="filters__search-icon" />
            <input
              ref={textInputRef}
              type="text"
              value={state.textFilter}
              name="textFilter"
              onChange={handleTextFilterChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Filter by text"
              className="filters__input"
            />
            {state.textFilter && (
              <button
                className="filters__close-button"
                onClick={() => {
                  setState((prev) => ({ ...prev, textFilter: '' }));
                  dataDispatch({
                    type: 'FILTER_INCOME_DATA',
                    textFilter: '',
                    selectedTags: state.selectedTags,
                  });
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        {(state.textFilter || state.selectedTags.length > 0) && (
          <button onClick={handleClearFilters} className="filters__clear-button">
            Clear Filters
          </button>
        )}
      </div>
      {(isFocused || state.textFilter || state.selectedTags.length > 0) && (
        <div className="filters__tags" ref={tagsContainerRef}>
          {incomeSuggestions.map((tag) => {
            const isSelected = state.selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={(e) => handleTagClick(tag, e)}
                onMouseDown={(e) => e.preventDefault()}
                className={`filters__tag ${isSelected ? 'filters__tag--selected' : ''}`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default React.memo(IncomeFilters);

