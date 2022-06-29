import React from "react";
import TransactionForm from "../../components/TransactionForm";
import {fetchData} from '../../utils/utils';
import {useAuthDispatch, useAuthState, useData} from "../../context";

const AddTransaction = () => {
  const { token } = useAuthState();
  const { dataDispatch } = useData();
  const dispatch = useAuthDispatch();
  return (
    <TransactionForm formType="add" onSuccess={() => {fetchData(token, dataDispatch, dispatch);}}/>
  );
};

export default AddTransaction;
