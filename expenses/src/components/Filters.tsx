import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
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

  const handleCategoryChange = useCallback((
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const category = event.target.value;
    setState((prevState) => ({
      ...prevState,
      category,
    }));
    dataDispatch({
      type: 'FILTER_DATA',
      category,
      textFilter: state.textFilter,
    });
  }, [dataDispatch, state.textFilter]);

  const handleTextFilterChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const textFilter = event.target.value;
    setState((prevState) => ({
      ...prevState,
      textFilter,
    }));
    dataDispatch({
      type: 'FILTER_DATA',
      category: state.category,
      textFilter,
    });
  }, [dataDispatch, state.category]);

  const handleClearFilters = useCallback(() => {
    setState({
      category: '',
      textFilter: '',
    });
    setShowTextFilter(false);
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
                setShowTextFilter(false);
                setState((prev) => ({ ...prev, textFilter: '' }));
                dataDispatch({
                  type: 'FILTER_DATA',
                  category: state.category,
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
