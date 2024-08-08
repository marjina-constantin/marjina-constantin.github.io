import React, { useState } from 'react';
import { useAuthDispatch, useAuthState, useData, useNotification } from '../context';
import { AuthState, DataState, NodeData } from '../type/types';
import { addOneDay, fetchRequest } from '../utils/utils';
import { notificationType } from '../utils/constants';
import { FaPlus } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { useParams } from 'react-router-dom';

interface PaymentFormProps {
  formType: string;
  values: {
    nid: string;
    title: string;
    field_date: string;
    field_rate?: number;
    field_pay_installment?: number;
    field_pay_single_fee?: number;
  };
  onSuccess: () => void;
  startDate?: string;
  endDate?: string;
}
const PaymentForm: React.FC<PaymentFormProps> = ({
                                                   formType,
                                                   values,
                                                   onSuccess,
                                                   startDate,
                                                   endDate,
                                                 }) => {
  const { id } = useParams();

  const showNotification = useNotification();
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData() as DataState;
  const initialState = {
    field_date: new Date().toISOString().slice(0, 10),
    title: '',
    field_rate: '',
    field_pay_installment: '',
    field_pay_single_fee: '',
    field_loan_reference: id,
  };
  const [formState, setFormState] = useState(
    formType === 'add' ? initialState : values
  );
  const { token } = useAuthState() as AuthState;
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormState({
      ...formState,
      [event.target.name]: value,
    });
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const node = {
      type: 'payment',
      title: [formState.title],
      field_date: [formState.field_date],
      field_rate: [formState.field_rate],
      field_pay_installment: [formState.field_pay_installment],
      field_pay_single_fee: [formState.field_pay_single_fee],
      field_loan_reference: [id],
    };
    const fetchOptions = {
      method: formType === 'add' ? 'POST' : 'PATCH',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': 'Bearer ' + token,
      }),
      body: JSON.stringify(node),
    };
    const url =
      formType === 'add'
        ? 'https://dev-expenses-api.pantheonsite.io/node?_format=json'
        : `https://dev-expenses-api.pantheonsite.io/node/${values.nid}?_format=json`;
    fetchRequest(
      url,
      fetchOptions,
      dataDispatch,
      dispatch,
      (data: NodeData) => {
        if (data.nid) {
          onSuccess();
          showNotification('Success!', notificationType.SUCCESS);
          setIsSubmitting(false);
          setFormState(initialState);
        } else {
          showNotification(
            'Something went wrong, please contact Sergiu S :)',
            notificationType.ERROR
          );
          setIsSubmitting(false);
        }
      }
    );
  };

  return (
    <div>
      <h2>{formType === 'add' ? 'Add Payment' : 'Edit Payment'}</h2>
      <form className="add-transaction" onSubmit={handleSubmit}>
        <input
          required
          placeholder="Title"
          type="text"
          name="title"
          value={formState.title}
          onChange={handleChange}
        />
        <input
          required
          placeholder="Event date"
          type="date"
          name="field_date"
          max={endDate}
          min={addOneDay(startDate)}
          value={formState.field_date}
          onChange={handleChange}
        />
        <input
          placeholder="New interest rate"
          type="number"
          name="field_rate"
          value={formState.field_rate}
          onChange={handleChange}
        />
        <input
          placeholder="Installment payment"
          type="number"
          name="field_pay_installment"
          value={formState.field_pay_installment}
          onChange={handleChange}
        />
        <input
          placeholder="Individual fee"
          type="number"
          name="field_pay_single_fee"
          value={formState.field_pay_single_fee}
          onChange={handleChange}
        />

        <button type="submit" disabled={isSubmitting} className="button w-100">
          {isSubmitting ? (
            <div className="loader">
              <span className="loader__element"></span>
              <span className="loader__element"></span>
              <span className="loader__element"></span>
            </div>
          ) : formType === 'add' ? (
            <FaPlus />
          ) : (
            <MdEdit />
          )}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
