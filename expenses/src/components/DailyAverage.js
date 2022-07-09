import React, {useEffect} from "react";
import {useAuthState, useData} from "../context";

export default function DailyAverage() {

  const { data } = useData();
  const { currency } = useAuthState();

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.raw, data.categoryTotals]);

  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed = parseInt((new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1);

  return (
    <>
      <span className="heading">Daily average per category</span>
      <table className="daily-average">
        <tbody>
        {Object.values(data.categoryTotals).map((item, key) => (
          <tr key={key}>
            <td>{item.name}</td>
            <td>{parseFloat(item.y / daysPassed).toFixed(2)} {currency} / day</td>
          </tr>
        ))}
        </tbody>
      </table>
      <div className="average-spending">
        Average spending per day: {parseFloat(data.totalSpent / daysPassed).toFixed(2)} {currency}
      </div>
    </>
  )
}
