import React, { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  show: boolean;
  onClose: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  children: ReactNode;
}

const closeEvent = {
  preventDefault: () => {},
} as React.MouseEvent<HTMLAnchorElement, MouseEvent>;

export default function Modal({ show, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIfClickedOutside = (e: MouseEvent) => {
      if (show && ref.current && !ref.current.contains(e.target as Node)) {
        onClose(e as unknown as React.MouseEvent<HTMLAnchorElement, MouseEvent>);
      }
    };
    document.addEventListener('mousedown', checkIfClickedOutside);
    return () => {
      document.removeEventListener('mousedown', checkIfClickedOutside);
    };
  }, [show, onClose]);

  useEffect(() => {
    if (!show || !ref.current) return;

    const panel = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea, input, select, a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));

    panel.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(closeEvent);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = getFocusable();
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [show, onClose]);

  return (
    <>
      {show ? (
        <div className="modal-window">
          <div ref={ref} tabIndex={-1}>
            <button
              type="button"
              title="Close"
              aria-label="Close"
              className="modal-close"
              onClick={(e) =>
                onClose(e as unknown as React.MouseEvent<HTMLAnchorElement, MouseEvent>)
              }
            >
              <X size={18} strokeWidth={1.75} />
            </button>
            {children}
          </div>
        </div>
      ) : (
        ''
      )}
    </>
  );
}
