import React from 'react';
import Modal from './Modal';
import { ButtonSpinner } from './LoadingSpinner';

interface ConfirmDeleteModalProps {
  show: boolean | string;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  /** e.g. "transaction" or "income" */
  itemLabel: string;
}

/**
 * Shared delete-confirmation modal used by Home and Income pages.
 * Displays a "are you sure?" prompt with a spinner-enabled confirm button.
 */
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  show,
  onClose,
  onConfirm,
  isSubmitting,
  itemLabel,
}) => (
  <Modal
    show={!!show}
    onClose={(e) => {
      e.preventDefault();
      onClose();
    }}
  >
    <h3>Are you sure you want to delete the {itemLabel}?</h3>
    <button onClick={onConfirm} className="button-primary">
      {isSubmitting ? <ButtonSpinner /> : `Yes, remove the ${itemLabel}`}
    </button>
  </Modal>
);

export default ConfirmDeleteModal;
