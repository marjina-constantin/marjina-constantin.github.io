import { useState } from 'react';

interface SwipeActions {
  startX: number | null;
  startY: number | null;
  swipedItemId: string | null;
  deleteVisible: boolean;
  editVisible: boolean;
  extraRowStyle: React.CSSProperties;
  isSwiping: boolean | null;
  swipeProgress: number; // 0-100 percentage of swipe completion
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

const useSwipeActions = (): SwipeActions => {
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState<boolean>(false);
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [extraRowStyle, setExtraRowStyle] = useState<React.CSSProperties>({});
  const [isSwiping, setIsSwiping] = useState<boolean | null>(null);
  const [swipeProgress, setSwipeProgress] = useState<number>(0);

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

      const diff = e.touches[0].clientX - (startX ?? 0);
      const itemElement = listRef.current?.querySelector(
        `[data-id="${swipedItemId}"]`
      ) as HTMLElement;
      if (itemElement) {
        itemElement.style.transform = `translateX(${diff}px)`;
        const itemWidth = itemElement.getBoundingClientRect().width;
        const absDiff = Math.abs(e.touches[0].clientX - (startX ?? 0));
        const diffPercentage = Math.min((absDiff / itemWidth) * 100, 100);
        setSwipeProgress(diffPercentage);
        
        // Set CSS custom property for animation
        itemElement.style.setProperty('--swipe-progress', `${diffPercentage}`);
        
        if (diffPercentage > 40) {
          const body = document.querySelector('body');
          if (body) {
            body.classList.add('action-active');
          }
        } else {
          const body = document.querySelector('body');
          if (body) {
            body.classList.remove('action-active');
          }
        }

        const isSwipingRight = diff > 0;
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
        itemElement.style.transition = 'all .3s ease';
        itemElement.style.transform = 'translateX(0)';
      }

      setStartX(null);
      setSwipedItemId(null);
      setDeleteVisible(false);
      setEditVisible(false);
      setExtraRowStyle({});
      setIsSwiping(null);
      setSwipeProgress(0);
      
      if (itemElement) {
        itemElement.style.removeProperty('--swipe-progress');
      }
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
    swipeProgress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

export default useSwipeActions;
