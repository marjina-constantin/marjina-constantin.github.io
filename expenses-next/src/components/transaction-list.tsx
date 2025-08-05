'use client';

import { useState } from 'react';
import { TransactionOrIncomeItem } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { deleteNode, fetchData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { TransactionForm } from './transaction-form';
import { formatApiDate } from '@/lib/utils';

interface TransactionListProps {
  transactions: TransactionOrIncomeItem[];
  monthTotal: number;
  month: string;
}

export const TransactionList = ({ transactions, monthTotal, month }: TransactionListProps) => {
  const { state: authState } = useAuth();
  const { state: dataState, dispatch: dataDispatch } = useData();
  const [editingTransaction, setEditingTransaction] = useState<TransactionOrIncomeItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionOrIncomeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (transaction: TransactionOrIncomeItem) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = async (transaction: TransactionOrIncomeItem) => {
    setIsSubmitting(true);
    try {
      await deleteNode(transaction.id, authState.token, (response: Response) => {
        if (response.ok) {
          toast.success('Transaction deleted successfully');
          // Refresh data after successful deletion
          fetchData(
            authState.token,
            dataDispatch,
            () => {},
            dataState.category,
            dataState.textFilter
          );
        } else {
          toast.error('Failed to delete transaction');
        }
      });
    } catch (error) {
      toast.error('An error occurred while deleting the transaction');
    } finally {
      setIsSubmitting(false);
      setDeletingTransaction(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingTransaction(null);
    // Refresh data after successful edit
    fetchData(
      authState.token,
      dataDispatch,
      () => {},
      dataState.category,
      dataState.textFilter
    );
  };

  const getCategoryName = (categoryValue: string): string => {
    const categories = [
      { value: '1', label: 'Clothing' },
      { value: '2', label: 'Entertainment' },
      { value: '3', label: 'Food' },
      { value: '4', label: 'Gifts' },
      { value: '5', label: 'Household Items/Supplies' },
      { value: '6', label: 'Housing' },
      { value: '7', label: 'Medical / Healthcare' },
      { value: '8', label: 'Personal' },
      { value: '9', label: 'Transportation' },
      { value: '10', label: 'Utilities' },
      { value: '11', label: 'Travel' },
      { value: '12', label: 'Family' },
      { value: '13', label: 'Investment' },
      { value: '14', label: 'Drinks' },
    ];
    
    const category = categories.find(cat => cat.value === categoryValue);
    return category?.label || 'Unknown';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions</span>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-lg font-bold">${monthTotal.toFixed(2)}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {formatApiDate(transaction.dt, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {transaction.cat ? getCategoryName(transaction.cat) : '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {transaction.dsc || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${parseFloat(transaction.sum).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
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
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transaction)}
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
        </CardContent>
      </Card>

      {editingTransaction && (
        <TransactionForm
          transaction={editingTransaction}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}; 