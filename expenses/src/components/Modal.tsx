import React, { useEffect, useRef, ReactNode } from 'react';

interface ModalProps {
  show: boolean;
  onClose: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  children: ReactNode;
}

export default function Modal({ show, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const checkIfClickedOutside = (e: MouseEvent) => {
      if (show && ref.current && !ref.current.contains(e.target as Node)) {
        onClose(
          e as unknown as React.MouseEvent<HTMLAnchorElement, MouseEvent>
        );
      }
    };
    document.addEventListener('mousedown', checkIfClickedOutside);
    return () => {
      document.removeEventListener('mousedown', checkIfClickedOutside);
    };
  }, [show, onClose]);

  return (
    <>
      {show ? (
        <div className="modal-window">
          <div ref={ref}>
            <a href="/" onClick={onClose} title="Close" className="modal-close">
              Close
            </a>
            {children}
          </div>
        </div>
      ) : (
        ''
      )}
    </>
  );
}
