import React from 'react';

const AmortizationScheduleTable = ({ amortizationSchedule }) => {
  return (
    <>
      <table className="expenses-table" cellSpacing="0" cellPadding="0">
        <thead>
          <tr>
            <th>Date</th>
            <th>Rate</th>
            <th>Installment</th>
            <th>Reduction</th>
            <th>Interest</th>
            <th>Principal</th>
            <th>Fee</th>
          </tr>
        </thead>
        <tbody>
          {amortizationSchedule?.map((element) => (
            <tr key={element[0]} data-id={element[0]}>
              <td>{element[0]}</td>
              <td>{element[1]}</td>
              <td>{element[2]}</td>
              <td>{element[3]}</td>
              <td>{element[4]}</td>
              <td>{element[5]}</td>
              <td>{element[6]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default AmortizationScheduleTable;
