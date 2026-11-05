import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  show: boolean;
  onClose: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  children: ReactNode;
}

const closeEvent = {
  preventDefault: () => {},
} as React.MouseEvent<HTMLAnchorElement, MouseEvent>;

const CLOSE_ANIMATION_MS = 280;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Modal({ show, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Callers often pass an inline onClose; depending on it would re-run the focus effect on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>(
    show ? 'open' : 'closed'
  );
  const closing = phase === 'closing';

  useEffect(() => {
    if (show) {
      setPhase('open');
      return;
    }
    setPhase((current) => {
      if (current === 'closed' || prefersReducedMotion()) return 'closed';
      return 'closing';
    });
  }, [show]);

  useEffect(() => {
    if (!closing) return;
    const timeout = window.setTimeout(() => setPhase('closed'), CLOSE_ANIMATION_MS);
    return () => window.clearTimeout(timeout);
  }, [closing]);

  useEffect(() => {
    const checkIfClickedOutside = (e: MouseEvent) => {
      if (show && ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current(e as unknown as React.MouseEvent<HTMLAnchorElement, MouseEvent>);
      }
    };
    document.addEventListener('mousedown', checkIfClickedOutside);
    return () => {
      document.removeEventListener('mousedown', checkIfClickedOutside);
    };
  }, [show]);

  useEffect(() => {
    if (!show || !ref.current) return;

    const panel = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea, input, select, a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));

    panel.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current(closeEvent);
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
      previouslyFocused?.focus?.();
    };
  }, [show]);

  if (phase === 'closed') return null;

  return (
    <div
      className={`modal-window${closing ? ' is-closing' : ''}`}
      onAnimationEnd={(event) => {
        if (event.animationName === 'modalBackdropFadeOut') {
          setPhase('closed');
        }
      }}
    >
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
  );
}
