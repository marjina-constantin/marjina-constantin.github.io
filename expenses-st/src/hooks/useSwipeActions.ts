// @ts-nocheck
import { useState } from 'react';

const useSwipeActions = () => {
  const [startX, setStartX] = useState(null);
  const [startY, setStartY] = useState(null);
  const [swipedItemId, setSwipedItemId] = useState(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [extraRowStyle, setExtraRowStyle] = useState({});
  const [isSwiping, setIsSwiping] = useState(null);

  const handleTouchStart = (e, id, tableRef) => {
    // Set initial touch start position and swiped item ID.
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setSwipedItemId(id);

    // Modify styles to prepare for the swipe animation.
    const trElement = tableRef.current.querySelector(`[data-id="${id}"]`);
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
  };

  const handleTouchMove = (e, tableRef) => {
    if (isSwiping === null) {
      // Check if swiping on x-axis.
      const distanceX = startX - e.touches[0].clientX;
      const distanceY = startY - e.touches[0].clientY;
      setIsSwiping(Math.abs(distanceX) > Math.abs(distanceY));
    }
    else if (isSwiping) {
      // Prevent vertical scrolling.
      document.body.style.overflow = 'hidden';

      // Perform actions based on touch movement.
      const diff = e.touches[0].clientX - startX;
      const trElement = tableRef.current.querySelector(`[data-id="${swipedItemId}"]`);
      // Apply transform style for the swipe effect.
      trElement.style.transform = `translateX(${diff}px)`;
      const trWidth = trElement.getBoundingClientRect().width;
      const absDiff = Math.abs(e.touches[0].clientX - startX);
      const diffPercentage = (absDiff / trWidth) * 100;
      const body = document.querySelector('body');
      if (diffPercentage > 40) {
        body.classList.add('action-active');
      }
      else {
        body.classList.remove('action-active');
      }

      // Determine whether to show delete or edit based on swipe direction.
      const isSwipingRight = diff > 0;
      setDeleteVisible(isSwipingRight);
      setEditVisible(!isSwipingRight);
    }
  };

  const handleTouchEnd = (e, tableRef, id, handleEdit, setShowDeleteModal) => {
    // Re-enable scrolling on the Y-axis.
    document.body.style.overflow = '';

    const endX = e.changedTouches[0].clientX;
    const trElement = tableRef.current.querySelector(`[data-id="${id}"]`);

    // Calculate touch end difference and trigger actions based on swipe.
    if (isSwiping) {
      const diff = Math.abs(endX - startX);
      const trWidth = trElement.getBoundingClientRect().width;
      const diffPercentage = (diff / trWidth) * 100;
      if (diffPercentage > 40) {
        if (endX > startX) {
          // Right swipe, trigger delete action.
          setShowDeleteModal(id);
        } else {
          // Left swipe, trigger edit action.
          handleEdit(id);
        }
      }
    }

    // Reset styles and states after touch end.
    trElement.style.transition = 'all .3s ease';
    trElement.style.transform = 'translateX(0)';

    setStartX(null);
    setSwipedItemId(null);
    setDeleteVisible(false);
    setEditVisible(false);
    setExtraRowStyle({});
    setIsSwiping(null);
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    deleteVisible,
    editVisible,
    extraRowStyle,
  };
};

export default useSwipeActions;
