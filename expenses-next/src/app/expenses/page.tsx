'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { fetchData } from '@/lib/api';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { TransactionList } from '@/components/transaction-list';
import { Filters } from '@/components/filters';

export default function ExpensesPage() {
  const { state: authState, isInitialized, dispatch: authDispatch } = useAuth();
  const { state: dataState, dispatch: dataDispatch } = useData();
  const router = useRouter();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // Check if user is logged in only after auth is initialized
  useEffect(() => {
    if (isInitialized && !authState.userIsLoggedIn) {
      router.push('/expenses/login');
      return;
    }
  }, [isInitialized, authState.userIsLoggedIn, router]);

  // Fetch data only if not already available and auth is ready
  useEffect(() => {
    if (!dataState.groupedData && authState.token && authState.userIsLoggedIn && isInitialized) {
      fetchData(authState.token, dataDispatch, authDispatch, '', '');
    }
  }, [authState.token, authState.userIsLoggedIn, isInitialized]);

  const months = dataState.groupedData ? Object.keys(dataState.groupedData) : [];
  const currentMonth = months[currentMonthIndex] || months[0];

  // Reset current month index when data changes
  useEffect(() => {
    if (months.length > 0 && currentMonthIndex >= months.length) {
      setCurrentMonthIndex(0);
    }
  }, [months.length, currentMonthIndex]);

  const handlePreviousMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < months.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const formatMonthDisplay = (monthKey: string) => {
    if (!monthKey || typeof monthKey !== 'string') {
      return 'Invalid Date';
    }
    
    const parts = monthKey.split('-');
    if (parts.length !== 2) {
      return 'Invalid Date';
    }
    
    const [year, month] = parts;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return 'Invalid Date';
    }
    
    const date = new Date(yearNum, monthNum - 1);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return format(date, 'MMMM yyyy');
  };

  const currentMonthTotal = dataState.totals?.[currentMonth] || 0;
  const currentMonthIncome = dataState.incomeTotals?.[currentMonth] || 0;
  const currentMonthTransactions = dataState.groupedData?.[currentMonth] || [];

  // Show loading or redirect if not authenticated
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authState.userIsLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (dataState.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses</h1>
      </div>

      <Filters />

      {currentMonth && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentMonthTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {formatMonthDisplay(currentMonth)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentMonthIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {formatMonthDisplay(currentMonth)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${currentMonthIncome - currentMonthTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(currentMonthIncome - currentMonthTotal).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatMonthDisplay(currentMonth)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {currentMonth && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{formatMonthDisplay(currentMonth)}</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                disabled={currentMonthIndex <= 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                disabled={currentMonthIndex >= months.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {currentMonthTransactions.length > 0 ? (
            <TransactionList 
              transactions={currentMonthTransactions}
              monthTotal={currentMonthTotal}
              month={currentMonth}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No transactions for this month</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 