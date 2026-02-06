import React from 'react';

/**
 * Inline button spinner — replaces the duplicated loader markup
 * used across TransactionForm, IncomeForm, and delete modals.
 */
export const ButtonSpinner: React.FC = () => (
  <div className="loader">
    <span className="loader__element"></span>
    <span className="loader__element"></span>
    <span className="loader__element"></span>
  </div>
);

/**
 * Full-page ripple loader — used when data is loading.
 */
export const PageLoader: React.FC = () => (
  <div className="lds-ripple">
    <div></div>
    <div></div>
  </div>
);
