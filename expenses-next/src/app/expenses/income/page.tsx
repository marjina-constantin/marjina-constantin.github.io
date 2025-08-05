'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { fetchData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { IncomeForm } from '@/components/income-form';
import { TransactionOrIncomeItem } from '@/types';
import { formatApiDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function IncomePage() {
  const { state: authState, isInitialized } = useAuth();
  const { state: dataState, dispatch: dataDispatch } = useData();
  const [editingIncome, setEditingIncome] = useState<TransactionOrIncomeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayCount, setDisplayCount] = useState(10);
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authState.userIsLoggedIn && isInitialized) {
      router.push('/expenses/login');
    }
  }, [authState.userIsLoggedIn, isInitialized, router]);

  // Load data if not available and user is authenticated
  useEffect(() => {
    if (!dataState.groupedData && authState.token && authState.userIsLoggedIn && isInitialized) {
      fetchData(authState.token, dataDispatch, () => {}, '', '');
    }
  }, [dataState.groupedData, authState.token, authState.userIsLoggedIn, isInitialized]);

  const handleEdit = (income: TransactionOrIncomeItem) => {
    setEditingIncome(income);
  };

  const handleDelete = async (income: TransactionOrIncomeItem) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`https://dev-expenses-api.pantheonsite.io/node/${income.id}?_format=json`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'JWT-Authorization': `Bearer ${authState.token}`,
        },
      });

      if (response.ok) {
        toast.success('Income deleted successfully');
        // Refresh data after successful deletion
        if (authState.token) {
          fetchData(authState.token, dataDispatch, () => {}, '', '');
        }
      } else {
        toast.error('Failed to delete income');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSuccess = () => {
    setEditingIncome(null);
    // Refresh data after successful operation
    if (authState.token) {
      fetchData(authState.token, dataDispatch, () => {}, '', '');
    }
  };

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 10);
  };

  const handleShowLess = () => {
    setDisplayCount(10);
  };

  const totalIncome = dataState.incomeData?.reduce((sum: number, income: TransactionOrIncomeItem) => sum + parseFloat(income.sum || '0'), 0) || 0;
  const displayedIncome = dataState.incomeData?.slice(0, displayCount) || [];
  const hasMoreIncome = dataState.incomeData && dataState.incomeData.length > displayCount;

  // Show loading if auth is not initialized
  if (!isInitialized) {
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
        <h1 className="text-3xl font-bold">Income</h1>
        <Button onClick={() => setEditingIncome({} as TransactionOrIncomeItem)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Total Income</span>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg font-bold">${totalIncome.toFixed(2)}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataState.incomeData && dataState.incomeData.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedIncome.map((income: TransactionOrIncomeItem) => (
                    <TableRow key={income.id}>
                      <TableCell>
                        {formatApiDate(income.dt, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {income.dsc || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${parseFloat(income.sum).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(income)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Income</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this income entry? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(income)}
                                  disabled={isSubmitting}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isSubmitting ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {hasMoreIncome && (
                <div className="flex justify-center mt-4">
                  <Button onClick={handleShowMore} variant="outline">
                    Show More
                  </Button>
                </div>
              )}
              
              {displayCount > 10 && (
                <div className="flex justify-center mt-2">
                  <Button onClick={handleShowLess} variant="ghost" size="sm">
                    Show Less
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No income entries found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {editingIncome && (
        <IncomeForm
          income={editingIncome.id ? editingIncome : undefined}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingIncome(null)}
        />
      )}
    </div>
  );
} 