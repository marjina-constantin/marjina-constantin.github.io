import React, { useState, useEffect } from 'react';
import {
  useAuthDispatch,
  useAuthState,
  useData,
  useNotification,
} from '../context';
import { notificationType, incomeSuggestions } from '../utils/constants';
import { AuthState, DataState, TransactionOrIncomeItem } from '../type/types';
import { addItemOffline, updateItemOffline } from '../utils/offlineAPI';
import { getItemFromDB } from '../utils/indexedDB';
import { fetchData, extractHashtags, addTagToText, removeTagFromText, hasTag } from '../utils/utils';

interface IncomeFormProps {
  formType: string;
  values: {
    nid: string;
    field_amount: string;
    field_date: string;
    field_description: string;
  };
  onSuccess: () => void;
}

const IncomeForm: React.FC<IncomeFormProps> = ({
  formType,
  values,
  onSuccess,
}) => {
  const showNotification = useNotification();
  const dispatch = useAuthDispatch();
  const { data, dataDispatch } = useData() as DataState;
  const initialState = {
    field_amount: '',
    field_date: new Date().toISOString().substr(0, 10),
    field_description: '',
  };
  const [formState, setFormState] = useState(
    formType === 'add' ? initialState : values
  );
  const { token } = useAuthState() as AuthState;
  
  // Track selected tags for highlighting
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Initialize selected tags when editing
  useEffect(() => {
    if (formType === 'edit' && formState.field_description) {
      const existingTags = extractHashtags(formState.field_description);
      setSelectedTags(existingTags);
    }
  }, [formType, formState.field_description]);
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormState({
      ...formState,
      [event.target.name]: value,
    });
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const node = {
      type: 'incomes',
      title: [formState.field_date],
      field_amount: [formState.field_amount],
      field_date: [formState.field_date],
      field_description: [formState.field_description],
    };

    try {
      if (formType === 'add') {
        await addItemOffline(
          node,
          token,
          async (_item: TransactionOrIncomeItem) => {
            onSuccess();
            showNotification('Success!', notificationType.SUCCESS);
            setIsSubmitting(false);
            setFormState(initialState);
            setSelectedTags([]);
            // Refresh data to show new item
            setTimeout(() => {
              fetchData(token, dataDispatch, dispatch);
            }, 0);
          },
          (error: string) => {
            showNotification(error, notificationType.ERROR);
            setIsSubmitting(false);
          }
        );
      } else {
        // Edit mode
        const existingItem = await getItemFromDB(values.nid);
        if (!existingItem) {
          showNotification(
            'Item not found in local cache',
            notificationType.ERROR
          );
          setIsSubmitting(false);
          return;
        }

        await updateItemOffline(
          node,
          values.nid,
          token,
          existingItem,
          async (_item: TransactionOrIncomeItem) => {
            onSuccess();
            showNotification('Success!', notificationType.SUCCESS);
            setIsSubmitting(false);
            setFormState(initialState);
            setSelectedTags([]);
            // Refresh data to show updated item
            setTimeout(() => {
              fetchData(token, dataDispatch, dispatch);
            }, 0);
          },
          (error: string) => {
            showNotification(error, notificationType.ERROR);
            setIsSubmitting(false);
          }
        );
      }
    } catch (error) {
      showNotification(
        'Something went wrong, please contact Sergiu S :)',
        notificationType.ERROR
      );
      setIsSubmitting(false);
    }
  };

  const handleTagClick = (tag: string) => {
    const hasTagInText = hasTag(formState.field_description, tag);
    let newDescription: string;
    
    if (hasTagInText) {
      // Remove tag if it exists
      newDescription = removeTagFromText(formState.field_description, tag);
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      // Add tag if it doesn't exist
      newDescription = addTagToText(formState.field_description, tag);
      setSelectedTags([...selectedTags, tag]);
    }
    
    setFormState({
      ...formState,
      field_description: newDescription,
    });
  };

  const today: Date = new Date();
  const offset = today.getTimezoneOffset();
  const maxDay = new Date(today.getTime() - offset * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return (
    <div>
      <h2>{formType === 'add' ? 'Add income' : 'Edit income'}</h2>
      <form className="add-transaction" onSubmit={handleSubmit}>
        <input
          required
          placeholder="Amount"
          type="number"
          name="field_amount"
          value={formState.field_amount}
          onChange={handleChange}
        />
        <input
          required
          placeholder="Date"
          type="date"
          max={maxDay}
          name="field_date"
          value={formState.field_date}
          onChange={handleChange}
        />
        <textarea
          placeholder="Description"
          name="field_description"
          rows={3}
          value={formState.field_description}
          onChange={handleChange}
        />
        <ul className="suggestions">
          {incomeSuggestions.map((tag) => {
            const isSelected = selectedTags.includes(tag) || hasTag(formState.field_description, tag);
            return (
              <li
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={isSelected ? 'selected-suggestion' : ''}
              >
                #{tag}
              </li>
            );
          })}
        </ul>
        <button type="submit" disabled={isSubmitting} className="button w-100">
          {isSubmitting ? (
            <div className="loader">
              <span className="loader__element"></span>
              <span className="loader__element"></span>
              <span className="loader__element"></span>
            </div>
          ) : formType === 'add' ? (
            'Add income'
          ) : (
            'Edit income'
          )}
        </button>
      </form>
    </div>
  );
};

export default IncomeForm;
