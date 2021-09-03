import React from "react";
import {categories} from "../utils/constants";
import {useData} from "../context";

export default function Filters() {

  const { data, dataDispatch } = useData();

  const handleChange = (event) => {
    const value = event.target.value;
    dataDispatch({ type: 'FILTER_DATA', category: value });
  };

  return (
    <div className="filters">
      <select name="category" onChange={handleChange}>
        {categories.map((category, id) => (
          <option selected={data.category === category.value} key={id} value={category.value}>{category.label}</option>
        ))}
      </select>
    </div>
  )
}
