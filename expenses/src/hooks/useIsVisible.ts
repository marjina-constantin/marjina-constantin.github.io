import { useRef, useState, useEffect } from 'react';

/**
 * Hook that uses IntersectionObserver to detect when an element
 * enters the viewport (or gets close to it). Once visible, it stays
 * visible permanently (one-shot) — the observer disconnects.
 *
 * @param rootMargin  How far outside the viewport to trigger (default '200px').
 */
export function useIsVisible(rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, isVisible };
}
