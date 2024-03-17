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
        fetchData(token, dataDispatch, dispatch);
      }}
    />
  );
};

export default AddTransaction;
