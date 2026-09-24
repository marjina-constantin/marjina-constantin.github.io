import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from './Modal';
import { ButtonSpinner } from './LoadingSpinner';
import { formatNumber } from '../../utils/utils';
import { monthNames } from '../../utils/constants';
import HashtagText from './HashtagText';

export interface DeletePreview {
  date: string;
  description?: string;
  amount: string;
}

interface ConfirmDeleteModalProps {
  show: boolean | string;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  /** e.g. "expense" or "income" */
  itemLabel: string;
  preview?: DeletePreview;
}

const splitPreviewDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    day: date.getDate(),
    month: monthNames[date.getMonth()]?.substring(0, 3).toUpperCase() ?? '',
    year: date.getFullYear(),
  };
};

/**
 * Shared delete-confirmation modal used by Home and Income pages.
 * Shows the entry being removed and a spinner-enabled confirm button.
 */
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  show,
  onClose,
  onConfirm,
  isSubmitting,
  itemLabel,
  preview,
}) => (
  <Modal
    show={!!show}
    onClose={(e) => {
      e.preventDefault();
      onClose();
    }}
  >
    <div className="confirm-delete">
      <h3>Delete this {itemLabel}?</h3>
      {preview && (
        <div className="confirm-delete__entry">
          {(() => {
            const date = splitPreviewDate(preview.date);
            if (!date) {
              return <div className="confirm-delete__date">{preview.date}</div>;
            }
            return (
              <div className="confirm-delete__date">
                <div className="confirm-delete__day">{date.day}</div>
                <div className="confirm-delete__month">{date.month}</div>
                <div className="confirm-delete__year">{date.year}</div>
              </div>
            );
          })()}
          <div className="confirm-delete__description">
            {preview.description?.trim() ? (
              <HashtagText text={preview.description} />
            ) : (
              'No description'
            )}
          </div>
          <div className="confirm-delete__amount">{formatNumber(preview.amount)}</div>
        </div>
      )}
      <button
        type="button"
        className="confirm-delete__confirm"
        onClick={onConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ButtonSpinner />
        ) : (
          <>
            <Trash2 size={18} strokeWidth={1.75} aria-hidden />
            Delete
          </>
        )}
      </button>
    </div>
  </Modal>
);

export default ConfirmDeleteModal;
