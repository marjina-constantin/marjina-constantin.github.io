import React from 'react';
import TransactionForm from '../../components/TransactionForm';
import { fetchData } from '../../utils/utils';
import { useAuthDispatch, useAuthState, useData } from '../../context';
import { AuthState, DataContext } from '../../type/types';

const AddTransaction = () => {
  const { token }: AuthState = useAuthState();
  const { dataDispatch }: DataContext = useData();
  const dispatch = useAuthDispatch();
  return (
    <TransactionForm
      formType="add"
      values={null}
      onSuccess={() => {
        fetchData(token, dataDispatch, dispatch);
      }}
    />
  );
};

export default AddTransaction;
