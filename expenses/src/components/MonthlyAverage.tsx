import React, { useEffect, useState, useMemo } from 'react';
import { useAuthState, useData } from '../context';
import { formatNumber } from '../utils/utils';
import { getClassNamesFor, useSortableData } from '../utils/useSortableData';
import { AuthState, DataState } from '../type/types';
export default function MonthlyAverage() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;
  const [showTrueCost, setShowTrueCost] = useState(false);

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.raw, data.categoryTotals]);

  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed: number =
    (new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1;
  const monthsPassed: number = daysPassed / 30.42;
  const monthlyAverage: number = data.totalSpent / monthsPassed;

  // Calculate hourly after-tax wage from income data (for true cost)
  const { hourlyWage, hoursPerMonth, categoryHoursOfWork } = useMemo(() => {
    if (!showTrueCost || !data.raw || data.raw.length === 0) {
      return { hourlyWage: 0, hoursPerMonth: 0, categoryHoursOfWork: {} };
    }

    // Calculate total income and time period
    const incomeData = data.raw.filter(item => item.type === 'incomes');
    const totalIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.sum || '0'), 0);
    
    // Calculate hourly wage (assuming 40 hours/week, 4.33 weeks/month)
    const monthlyIncome = monthsPassed > 0 ? totalIncome / monthsPassed : 0;
    const hoursPerMonth = 40 * 4.33; // Average hours per month
    const hourlyWage = hoursPerMonth > 0 ? monthlyIncome / hoursPerMonth : 0;

    // Calculate hours of work per category
    const categoryHoursOfWork: Record<string, number> = {};
    Object.values(data.categoryTotals || []).forEach((category) => {
      if (category && category.name) {
        const monthlyCost = monthsPassed > 0 ? category.y / monthsPassed : 0;
        categoryHoursOfWork[category.name] = hourlyWage > 0 ? monthlyCost / hourlyWage : 0;
      }
    });

    return { hourlyWage, hoursPerMonth, categoryHoursOfWork };
  }, [showTrueCost, data.raw, data.categoryTotals, monthsPassed]);

  // Prepare data for sorting (add hoursOfWork when showTrueCost is enabled)
  const itemsForSorting = useMemo(() => {
    return Object.values(data.categoryTotals || []).map((category) => ({
      ...category,
      hoursOfWork: showTrueCost ? (categoryHoursOfWork[category.name] || 0) : 0,
    }));
  }, [data.categoryTotals, showTrueCost, categoryHoursOfWork]);

  const { sortedItems, requestSort, sortConfig } = useSortableData(itemsForSorting);

  // Calculate totals for true cost
  const trueCostTotals = useMemo(() => {
    if (!showTrueCost) {
      return { totalHoursOfWork: 0 };
    }
    const totalHoursOfWork = Object.values(categoryHoursOfWork).reduce((sum, hours) => sum + hours, 0);
    return { totalHoursOfWork };
  }, [showTrueCost, categoryHoursOfWork]);

  return (
    <>
      <span className="heading">Monthly average per category</span>
      {showTrueCost && (
        <div style={{ 
          padding: '0.5rem 1rem', 
          fontSize: '0.85rem', 
          color: '#a0a0a0',
          marginBottom: '1rem'
        }}>
          <p>See how much of your life you trade for each expense category</p>
          <p style={{ fontStyle: 'italic', marginTop: '0.25rem' }}>
            Based on your hourly after-tax wage: {formatNumber(hourlyWage)} {currency}/hour
          </p>
        </div>
      )}
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          cursor: 'pointer',
          padding: '0.5rem 1rem',
          fontSize: '0.9rem',
          color: '#a0a0a0'
        }}>
          <input
            type="checkbox"
            checked={showTrueCost}
            onChange={(e) => setShowTrueCost(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Show True Cost (Hours of Life Worked)</span>
        </label>
      </div>
      <table className={`daily-average ${showTrueCost ? 'true-cost-table' : ''}`}>
        <thead>
          <tr>
            <th>Category</th>
            <th
              onClick={() => requestSort('y')}
              className={`sortable ${getClassNamesFor(sortConfig, 'y')}`}
            >
              Amount
            </th>
            {showTrueCost && (
              <th
                onClick={() => requestSort('hoursOfWork')}
                className={`sortable ${getClassNamesFor(sortConfig, 'hoursOfWork')}`}
              >
                Hours of Life Worked
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, key) => (
            <tr key={key}>
              <td>{item.name}</td>
              <td>
                {formatNumber(item.y / monthsPassed)} {currency} / month
              </td>
              {showTrueCost && (
                <td>
                  {formatNumber((item as any).hoursOfWork || 0)} hours
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="average-spending">
        Average spending per month: {formatNumber(monthlyAverage)} {currency}
      </div>
      {showTrueCost && (
        <div style={{ 
          padding: '1rem', 
          fontSize: '0.9rem', 
          color: '#a0a0a0',
          fontStyle: 'italic',
          marginTop: '0.5rem'
        }}>
          <p>This table shows you exactly how much of your life you traded for each expense. Use it to identify areas where you might want to reduce spending. Total hours per month: {formatNumber(trueCostTotals.totalHoursOfWork)} hours of {formatNumber(hoursPerMonth)} worked per month.</p>
        </div>
      )}
    </>
  );
}
