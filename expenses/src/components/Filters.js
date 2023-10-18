import React, {useState, useEffect, useRef} from "react";
import {categories} from "../utils/constants";
import {useData} from "../context";
import {FaSearch} from "react-icons/fa";

export default function Filters() {
  const { data, dataDispatch } = useData();

  const [state, setState] = useState({
    category: data.category ?? '',
    textFilter: data.textFilter ?? '',
  });
  const [showTextFilter, setShowTextFilter] = useState(false);

  const prevFilterState = useRef(state);

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
    setState({
      category: '',
      textFilter: '',
    });
    setShowTextFilter(false);
  };

  useEffect(() => {
    if (prevFilterState.current !== state) {
      // Run the effect only when filterState changes
      dataDispatch({
        type: "FILTER_DATA",
        category: state.category,
        textFilter: state.textFilter,
      });
      prevFilterState.current = state;
    }
  }, [state]);

  return (
    <div className="filters">
      <FaSearch onClick={() => {setShowTextFilter(true)}}/>
      {showTextFilter && (<input
        type="text"
        value={data.textFilter}
        name="textFilter"
        onChange={handleTextFilterChange}
        placeholder="Filter by text"
      />)}
      <select value={data.category} name="category" onChange={handleCategoryChange}>
        {categories.map((category, id) => (
          <option key={id} value={category.value}>{category.label}</option>
        ))}
      </select>
      {(state.textFilter || state.category) && (<button onClick={handleClearFilters} className="btn-outline">Clear Filters</button>)}
    </div>
  );
}
