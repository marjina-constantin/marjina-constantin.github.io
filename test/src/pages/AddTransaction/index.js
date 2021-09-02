import React from "react";
import TransactionForm from "../../components/TransactionForm";
import {fetchData} from '../../utils/utils';
import {useAuthState, useData} from "../../context";

const AddTransaction = () => {
  const { token } = useAuthState();
  const { dataDispatch } = useData();
  return (
    <TransactionForm formType="add" onSuccess={() => {fetchData(token, dataDispatch);}}/>
  );
};

export default AddTransaction;
