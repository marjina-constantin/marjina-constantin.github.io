import React, {useState, useEffect, useRef, useLayoutEffect} from "react";
import {categories} from "../utils/constants";
import {useData} from "../context";
import {FaSearch, FaCalendar} from "react-icons/fa";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import Modal from "./Modal";

export default function Filters() {
  const { data, dataDispatch } = useData();

  const [state, setState] = useState({
    category: data.category ?? '',
    textFilter: data.textFilter ?? '',
  });
  const [showTextFilter, setShowTextFilter] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const textInputRef = useRef(null);

  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection',
    },
  ]);

  console.log(9, dateRange)

  const handleDateRangeChange = (ranges) => {
    // Update the state with the selected date range
    setDateRange([ranges.selection]);

    console.log(78, ranges.selection)

    // Hide the date picker after a range is selected
    // setShowDatePicker(false);
  };

  const handleToggleDatePicker = () => {
    // Toggle the visibility of the date picker
    setShowDatePicker(!showDatePicker);
  };

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

  useLayoutEffect(() => {
    if (showTextFilter && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [showTextFilter]);

  return (
    <div className="filters">
      {!showTextFilter && <FaSearch onClick={() => {setShowTextFilter(true)}}/>}

      <FaCalendar onClick={() => {
        handleToggleDatePicker()
      }}/>

      {showTextFilter && (<input
        ref={textInputRef}
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

      {showDatePicker && (<DateRange
        editableDateInputs={true}
        onChange={handleDateRangeChange}
        moveRangeOnFirstSelection={false}
        ranges={dateRange}
      />)}
      {/*<Modal show={showDatePicker} onClose={(e) => {e.preventDefault(); setShowDatePicker(false)}}>*/}
      {/*  <DateRange*/}
      {/*    editableDateInputs={true}*/}
      {/*    onChange={handleDateRangeChange}*/}
      {/*    moveRangeOnFirstSelection={false}*/}
      {/*    ranges={dateRange}*/}
      {/*  />*/}
      {/*</Modal>*/}
    </div>
  );
}
