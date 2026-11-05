import { RefObject, useLayoutEffect, useRef } from 'react';

/**
 * Animates list rows smoothly into their new positions (FLIP) when sort order changes
 * ("Others slide 200ms").
 */
export function useFlipList(
  listRef: RefObject<HTMLElement>,
  orderKey: string,
  triggerKey: string
) {
  const prevTopsRef = useRef<Map<string, number>>(new Map());
  const prevTriggerRef = useRef<string>(triggerKey);

  useLayoutEffect(() => {
    const root = listRef.current;
    if (!root) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>('[data-flip-id]')
    );
    const nextTops = new Map<string, number>();
    const shouldAnimate =
      !prefersReduced &&
      prevTriggerRef.current !== triggerKey &&
      prevTopsRef.current.size > 0;

    for (const node of nodes) {
      const id = node.dataset.flipId || '';
      const top = node.getBoundingClientRect().top;
      nextTops.set(id, top);

      if (!shouldAnimate) continue;
      const prevTop = prevTopsRef.current.get(id);
      if (prevTop === undefined) continue;
      const dy = prevTop - top;
      if (Math.abs(dy) < 1) continue;

      node.animate(
        [
          { transform: `translate3d(0, ${dy}px, 0)` },
          { transform: 'translate3d(0, 0, 0)' },
        ],
        {
          duration: 240,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }
      );
    }

    prevTopsRef.current = nextTops;
    prevTriggerRef.current = triggerKey;
  }, [listRef, orderKey, triggerKey]);
}
