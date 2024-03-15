import React, { useEffect, useRef } from 'react';

export default function Modal({ show, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const checkIfClickedOutside = (e) => {
      if (show && ref.current && !ref.current.contains(e.target)) {
        onClose(e);
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
