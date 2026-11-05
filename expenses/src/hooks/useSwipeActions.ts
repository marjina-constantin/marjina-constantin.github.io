import { useState } from 'react';

interface SwipeActions {
  startX: number | null;
  startY: number | null;
  swipedItemId: string | null;
  deleteVisible: boolean;
  editVisible: boolean;
  extraRowStyle: React.CSSProperties;
  isSwiping: boolean | null;
  handleTouchStart: (
    e: React.TouchEvent<HTMLDivElement>,
    id: string,
    listRef: React.RefObject<HTMLDivElement>
  ) => void;
  handleTouchMove: (
    e: React.TouchEvent<HTMLDivElement>,
    listRef: React.RefObject<HTMLDivElement>
  ) => void;
  handleTouchEnd: (
    e: React.TouchEvent<HTMLDivElement>,
    listRef: React.RefObject<HTMLDivElement>,
    id: string,
    handleEdit: (id: string) => void,
    onDelete: (id: string) => void
  ) => void;
}

const RESISTANCE_RATIO = 0.35;

const useSwipeActions = (): SwipeActions => {
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState<boolean>(false);
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [extraRowStyle, setExtraRowStyle] = useState<React.CSSProperties>({});
  const [isSwiping, setIsSwiping] = useState<boolean | null>(null);

  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>,
    id: string,
    listRef: React.RefObject<HTMLDivElement>
  ) => {
    const touch = e.touches[0];
    if (touch) {
      setStartX(touch.clientX);
      setStartY(touch.clientY);
      setSwipedItemId(id);

      const itemElement = listRef.current?.querySelector(
        `[data-id="${id}"]`
      ) as HTMLElement;
      if (itemElement) {
        itemElement.style.transition = 'transform 0s';
      }
    }
  };

  const handleTouchMove = (
    e: React.TouchEvent<HTMLDivElement>,
    listRef: React.RefObject<HTMLDivElement>
  ) => {
    if (isSwiping === null) {
      const touch = e.touches[0];
      if (touch && startX !== null && startY !== null) {
        const distanceX = startX - touch.clientX;
        const distanceY = startY - touch.clientY;
        setIsSwiping(Math.abs(distanceX) > Math.abs(distanceY));
      }
    } else if (isSwiping) {
      document.body.style.overflow = 'hidden';

      const rawDiff = e.touches[0].clientX - (startX ?? 0);
      const itemElement = listRef.current?.querySelector(
        `[data-id="${swipedItemId}"]`
      ) as HTMLElement;
      if (itemElement) {
        const itemWidth = itemElement.getBoundingClientRect().width;
        const absDiff = Math.abs(rawDiff);
        const diffPercentage = Math.min((absDiff / itemWidth) * 100, 100);

        // Apply weighted 35% resistance ("Resist the pull") once past the initial threshold
        const thresholdPx = itemWidth * 0.28;
        const sign = rawDiff >= 0 ? 1 : -1;
        const dampedAbs =
          absDiff <= thresholdPx
            ? absDiff * 0.65
            : thresholdPx * 0.65 + (absDiff - thresholdPx) * RESISTANCE_RATIO;
        const dampedDiff = sign * dampedAbs;

        itemElement.style.transform = `translate3d(${dampedDiff}px, 0, 0) scale(1.015)`;
        itemElement.classList.add('is-swiping');

        const body = document.querySelector('body');
        if (diffPercentage > 40) {
          body?.classList.add('action-active');
        } else {
          body?.classList.remove('action-active');
        }

        const isSwipingRight = rawDiff > 0;
        setDeleteVisible(isSwipingRight);
        setEditVisible(!isSwipingRight);
      }
    }
  };

  const handleTouchEnd = (
    e: React.TouchEvent<HTMLDivElement>,
    listRef: React.RefObject<HTMLDivElement>,
    id: string,
    handleEdit: (id: string) => void,
    onDelete: (id: string) => void
  ) => {
    document.body.style.overflow = '';
    document.querySelector('body')?.classList.remove('action-active');

    const touch = e.changedTouches[0];
    if (touch && startX !== null) {
      const endX = touch.clientX;
      const itemElement = listRef.current?.querySelector(
        `[data-id="${id}"]`
      ) as HTMLElement;

      if (isSwiping) {
        const diff = Math.abs(endX - startX);
        const itemWidth = itemElement?.getBoundingClientRect().width || 0;
        const diffPercentage = itemWidth > 0 ? (diff / itemWidth) * 100 : 0;
        if (diffPercentage > 40) {
          if (endX > startX) {
            onDelete(id);
          } else {
            handleEdit(id);
          }
        }
      }

      if (itemElement) {
        itemElement.classList.remove('is-swiping');
        itemElement.style.transition =
          'transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)';
        itemElement.style.transform = 'translate3d(0, 0, 0) scale(1)';
      }

      setStartX(null);
      setSwipedItemId(null);
      setDeleteVisible(false);
      setEditVisible(false);
      setExtraRowStyle({});
      setIsSwiping(null);
    }
  };

  return {
    startX,
    startY,
    swipedItemId,
    deleteVisible,
    editVisible,
    extraRowStyle,
    isSwiping,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

export default useSwipeActions;
