'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { useRouter } from 'next/navigation';
import { fetchData } from '@/lib/api';
import { TransactionForm } from '@/components/transaction-form';

export default function AddTransactionPage() {
  const { state: authState, isInitialized } = useAuth();
  const { dispatch: dataDispatch } = useData();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authState.userIsLoggedIn && isInitialized) {
      router.push('/expenses/login');
    }
  }, [authState.userIsLoggedIn, isInitialized, router]);

  const handleSuccess = () => {
    // Refresh data after successful transaction creation
    if (authState.token) {
      fetchData(authState.token, dataDispatch, () => {}, '', '');
    }
    router.push('/expenses');
  };

  const handleCancel = () => {
    router.push('/expenses');
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authState.userIsLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add Transaction</h1>
      </div>
      <TransactionForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
} 