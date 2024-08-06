import React from 'react';
import AmortizationScheduleTable from './AmortizationScheduleTable';

const LoanDetails = (props) => {
  const loan = props?.loan ?? {};
  const amortizationSchedule = props?.amortizationSchedule ?? [];

  return (
    <>
      <h2>Predication for this loan</h2>
      <ul className="loan-details">
        <li>Sum of interests: {loan?.sum_of_interests}</li>
        <li>Sum of reductions: {loan?.sum_of_reductions}</li>
        <li>Sum of installments: {loan?.sum_of_installments}</li>
        <li>Remaining principal: {loan?.remaining_principal}</li>
        <li>Days calculated: {loan?.days_calculated}</li>
        <li>Actual end date: {loan?.actual_end_date}</li>
        <li>Latest payment date: {loan?.latest_payment_date}</li>
        <li>Unpaid interest: {loan?.unpaid_interest}</li>
        <li>Sum of fees: {loan?.sum_of_fees}</li>
      </ul>

      <AmortizationScheduleTable amortizationSchedule={amortizationSchedule} />
    </>
  );
};

export default LoanDetails;
