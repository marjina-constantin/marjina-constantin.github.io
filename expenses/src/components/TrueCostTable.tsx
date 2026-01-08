import React, { useMemo } from 'react';
import { useAuthState, useData } from '../context';
import { formatNumber } from '../utils/utils';
import { getClassNamesFor, useSortableData } from '../utils/useSortableData';
import { AuthState, DataState } from '../type/types';

export default function TrueCostTable() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;

  // Calculate hourly after-tax wage from income data
  const { hourlyWage, monthlyCosts } = useMemo(() => {
    if (!data.raw || data.raw.length === 0) {
      return { hourlyWage: 0, monthlyCosts: [] };
    }

    // Calculate total income and time period
    const incomeData = data.raw.filter(item => item.type === 'incomes');
    const firstDay = data.raw[data.raw.length - 1]?.dt;
    const daysPassed = (new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1;
    const monthsPassed = daysPassed / 30.42;
    
    // Calculate total income
    const totalIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.sum || '0'), 0);
    
    // Calculate hourly wage (assuming 40 hours/week, 4.33 weeks/month)
    // Monthly income / (40 hours/week * 4.33 weeks/month) = hourly wage
    const monthlyIncome = monthsPassed > 0 ? totalIncome / monthsPassed : 0;
    const hoursPerMonth = 40 * 4.33; // Average hours per month
    const hourlyWage = hoursPerMonth > 0 ? monthlyIncome / hoursPerMonth : 0;

    // Calculate monthly costs per category
    const categoryMonthlyCosts: Record<string, { name: string; monthlyCost: number }> = {};
    
    Object.values(data.categoryTotals || []).forEach((category) => {
      if (category && category.name) {
        const monthlyCost = monthsPassed > 0 ? category.y / monthsPassed : 0;
        categoryMonthlyCosts[category.name] = {
          name: category.name,
          monthlyCost,
        };
      }
    });

    // Convert to array and calculate hours of life worked
    const monthlyCosts = Object.values(categoryMonthlyCosts).map((category) => ({
      name: category.name,
      monthlyCost: category.monthlyCost,
      hoursOfWork: hourlyWage > 0 ? category.monthlyCost / hourlyWage : 0,
    }));

    return { hourlyWage, monthlyCosts };
  }, [data.raw, data.categoryTotals]);

  const { sortedItems, requestSort, sortConfig } = useSortableData(monthlyCosts);

  if (!data.raw || data.raw.length === 0 || hourlyWage === 0) {
    return null;
  }

  return (
    <>
      <span className="heading">True Cost Table</span>
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
      <table className="daily-average true-cost-table">
        <thead>
          <tr>
            <th>Expense Category</th>
            <th
              onClick={() => requestSort('monthlyCost')}
              className={`sortable ${getClassNamesFor(sortConfig, 'monthlyCost')}`}
            >
              Monthly Cost
            </th>
            <th
              onClick={() => requestSort('hoursOfWork')}
              className={`sortable ${getClassNamesFor(sortConfig, 'hoursOfWork')}`}
            >
              Hours of Life Worked
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item: any, key) => (
            <tr key={key}>
              <td>{item.name}</td>
              <td>
                {formatNumber(item.monthlyCost)} {currency}
              </td>
              <td>
                {formatNumber(item.hoursOfWork)} hours
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ 
        padding: '1rem', 
        fontSize: '0.9rem', 
        color: '#a0a0a0',
        fontStyle: 'italic',
        marginTop: '0.5rem'
      }}>
        <p>This table shows you exactly how much of your life you traded for each expense. Use it to identify areas where you might want to reduce spending.</p>
      </div>
    </>
  );
}
