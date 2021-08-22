import React, {useState} from "react";
import TransactionForm from "../../components/TransactionForm";

const AddTransaction = () => {
  return (
    <TransactionForm formType="add" onSuccess={() => {}}/>
  );
};

export default AddTransaction;
