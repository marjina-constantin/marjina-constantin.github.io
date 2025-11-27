import React from 'react';
import TransactionForm from '../../components/TransactionForm';
import { fetchData } from '../../utils/utils';
import { useAuthDispatch, useAuthState, useData } from '../../context';
import { AuthState, DataState } from '../../type/types';

const AddTransaction = () => {
  const { token } = useAuthState() as AuthState;
  const { dataDispatch } = useData() as DataState;
  const dispatch = useAuthDispatch();
  return (
    <TransactionForm
      formType="add"
      values={null}
      onSuccess={() => {
        // Refetch in background - use setTimeout to avoid blocking UI
        setTimeout(() => {
          fetchData(token, dataDispatch, dispatch);
        }, 0);
      }}
    />
  );
};

export default AddTransaction;
