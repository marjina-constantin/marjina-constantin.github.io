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
    tableRef: React.RefObject<HTMLTableElement>
  ) => void;
  handleTouchMove: (
    e: React.TouchEvent<HTMLDivElement>,
    tableRef: React.RefObject<HTMLTableElement>
  ) => void;
  handleTouchEnd: (
    e: React.TouchEvent<HTMLDivElement>,
    tableRef: React.RefObject<HTMLTableElement>,
    id: string,
    handleEdit: (id: string) => void,
    setShowDeleteModal: (id: string) => void
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

  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>,
    id: string,
    tableRef: React.RefObject<HTMLTableElement>
  ) => {
    const touch = e.touches[0];
    if (touch) {
      setStartX(touch.clientX);
      setStartY(touch.clientY);
      setSwipedItemId(id);

      const trElement = tableRef.current?.querySelector(
        `[data-id="${id}"]`
      ) as HTMLElement;
      if (trElement) {
        trElement.style.transition = 'transform 0s';
        const rect = trElement.getBoundingClientRect();
        setExtraRowStyle({
          position: 'fixed',
          zIndex: '-1',
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        });
      }
    }
  };

  const handleTouchMove = (
    e: React.TouchEvent<HTMLDivElement>,
    tableRef: React.RefObject<HTMLTableElement>
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
      const trElement = tableRef.current?.querySelector(
        `[data-id="${swipedItemId}"]`
      ) as HTMLElement;
      if (trElement) {
        trElement.style.transform = `translateX(${diff}px)`;
        const trWidth = trElement.getBoundingClientRect().width;
        const absDiff = Math.abs(e.touches[0].clientX - (startX ?? 0));
        const diffPercentage = (absDiff / trWidth) * 100;
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
    tableRef: React.RefObject<HTMLTableElement>,
    id: string,
    handleEdit: (id: string) => void,
    setShowDeleteModal: (id: string) => void
  ) => {
    document.body.style.overflow = '';

    const touch = e.changedTouches[0];
    if (touch && startX !== null) {
      const endX = touch.clientX;
      const trElement = tableRef.current?.querySelector(
        `[data-id="${id}"]`
      ) as HTMLElement;

      if (isSwiping) {
        const diff = Math.abs(endX - startX);
        const trWidth = trElement.getBoundingClientRect().width;
        const diffPercentage = (diff / trWidth) * 100;
        if (diffPercentage > 40) {
          if (endX > startX) {
            setShowDeleteModal(id);
          } else {
            handleEdit(id);
          }
        }
      }

      if (trElement) {
        trElement.style.transition = 'all .3s ease';
        trElement.style.transform = 'translateX(0)';
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
