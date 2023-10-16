import React, {useState, useEffect} from "react";
import {categories} from "../utils/constants";
import {useData} from "../context";

export default function Filters() {
  const { data, dataDispatch } = useData();

  const defaultState = {
    category: data.category ?? '',
    textFilter: '',
  };
  const [state, setState] = useState(defaultState);

  const handleCategoryChange = (event) => {
    const category = event.target.value;
    setState((prevState) => ({
      ...prevState,
      category,
    }));
  };

  const handleTextFilterChange = (event) => {
    const textFilter = event.target.value;
    setState((prevState) => ({
      ...prevState,
      textFilter,
    }));
  };

  const handleClearFilters = () => {
    setState(defaultState);
  };

  useEffect(() => {
    dataDispatch({ type: 'FILTER_DATA', category: state.category, textFilter: state.textFilter });
  }, [state]);

  return (
    <div className="filters">
      <input
        type="text"
        value={state.textFilter}
        name="textFilter"
        onChange={handleTextFilterChange}
        placeholder="Filter by text"
      />
      <select value={data.category} name="category" onChange={handleCategoryChange}>
        {categories.map((category, id) => (
          <option key={id} value={category.value}>{category.label}</option>
        ))}
      </select>
      <button onClick={handleClearFilters} className="btn-outline">Clear Filters</button>
    </div>
  );
}
