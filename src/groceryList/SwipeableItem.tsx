import React, { useState, useRef, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';

// -----------------------------------------------------------------------
// Styles — co-located because nothing outside this file uses them.
// -----------------------------------------------------------------------

/** Clip overflow so the sliding card doesn't show outside the row */
const SwipeRow = styled.div`
  position: relative;
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
  /* Prevent iOS rubber-band from interfering with horizontal swipe */
  touch-action: pan-y;
`;

/** The coloured action revealed behind the card */
const SwipeReveal = styled.div<{ $side: 'left' | 'right' }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  /* Edit (left swipe) = blue; Delete (right swipe) = red */
  background: ${p => p.$side === 'left' ? '#5555cc' : '#e05555'};
  justify-content: ${p => p.$side === 'left' ? 'flex-end' : 'flex-start'};
  padding: 0 22px;
  border-radius: 12px;
`;

const RevealIcon = styled.span`
  font-size: 20px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  user-select: none;
`;

const RevealLabel = styled.span`
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.85);
  font-family: 'Georgia', serif;
`;

const springBack = keyframes`
  from { transform: translateX(var(--swipe-from)); }
  to   { transform: translateX(0); }
`;

/** The card that slides. CSS var --swipe-from lets the spring-back
 *  keyframe start from wherever the finger released. */
const SwipeCard = styled.div<{
  $springing: boolean;
  $exitDir: 'left' | 'right' | null;
}>`
  position: relative;
  z-index: 1;
  will-change: transform;
  border-radius: 12px;
  /* Spring back animation — CSS variable set inline on the element */
  ${p => p.$springing && css`
    animation: ${springBack} 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  `}
  ${p => p.$exitDir && css`
    transition: transform 0.22s ease-in, opacity 0.22s ease-in;
    opacity: 0;
    transform: translateX(${p.$exitDir === 'right' ? '110%' : '-110%'});
  `}
`;

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

interface SwipeableItemProps {
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 72; // px to commit action
const INTENT_RATIO   = 1.4; // horizontal must be N× more than vertical to lock in

/**
 * Wraps any row content with swipe-left-to-edit / swipe-right-to-delete
 * gestures, using the Pointer Events API (works for touch + mouse).
 *
 * Gesture lifecycle: pointerdown starts tracking → pointermove decides
 * "is this a horizontal swipe or a vertical scroll?" once movement
 * clears a small dead zone → pointerup/cancel commits: past
 * SWIPE_THRESHOLD triggers onEdit/onDelete with an exit animation,
 * otherwise the card springs back to center.
 */
export const SwipeableItem: React.FC<SwipeableItemProps> = ({ onEdit, onDelete, children }) => {
  const [offsetX, setOffsetX]     = useState(0);
  const [springing, setSpringing] = useState(false);
  const [exitDir, setExitDir]     = useState<'left' | 'right' | null>(null);

  const startX     = useRef(0);
  const startY     = useRef(0);
  const currentX   = useRef(0);
  const isDragging = useRef(false);  // true once horizontal intent confirmed
  const pointerId  = useRef<number | null>(null);
  const cardRef    = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only track one finger at a time
    if (pointerId.current !== null) return;
    pointerId.current = e.pointerId;
    startX.current    = e.clientX;
    startY.current    = e.clientY;
    currentX.current  = e.clientX;
    isDragging.current = false;
    setSpringing(false);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!isDragging.current) {
      // Decide intent: only commit to horizontal swipe if dx dominates
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return; // still in dead zone
      if (Math.abs(dy) > Math.abs(dx) * INTENT_RATIO) {
        // Vertical scroll wins — release this touch
        pointerId.current = null;
        return;
      }
      isDragging.current = true;
      // Lock touch-action to none on the card while swiping
      if (cardRef.current) cardRef.current.style.touchAction = 'none';
    }

    e.preventDefault();
    currentX.current = e.clientX;
    setOffsetX(dx);
  }, []);

  const commit = useCallback(() => {
    if (!isDragging.current) {
      pointerId.current = null;
      return;
    }
    isDragging.current = false;
    pointerId.current  = null;
    if (cardRef.current) cardRef.current.style.touchAction = '';

    const dx = currentX.current - startX.current;

    if (dx < -SWIPE_THRESHOLD) {
      // Swiped left → edit
      setExitDir('left');
      setTimeout(() => {
        setExitDir(null);
        setOffsetX(0);
        onEdit();
      }, 220);
    } else if (dx > SWIPE_THRESHOLD) {
      // Swiped right → delete
      setExitDir('right');
      setTimeout(() => {
        setExitDir(null);
        setOffsetX(0);
        onDelete();
      }, 220);
    } else {
      // Below threshold — spring back
      if (cardRef.current) {
        cardRef.current.style.setProperty('--swipe-from', `${dx}px`);
      }
      setSpringing(true);
      setOffsetX(0);
      setTimeout(() => setSpringing(false), 340);
    }
  }, [onEdit, onDelete]);

  const side: 'left' | 'right' | null =
    offsetX < -8 ? 'left' : offsetX > 8 ? 'right' : null;

  return (
    <SwipeRow>
      {/* Action revealed behind the card */}
      {side === 'left' && (
        <SwipeReveal $side="left">
          <RevealIcon>
            ✎
            <RevealLabel>Edit</RevealLabel>
          </RevealIcon>
        </SwipeReveal>
      )}
      {side === 'right' && (
        <SwipeReveal $side="right">
          <RevealIcon>
            ✕
            <RevealLabel>Delete</RevealLabel>
          </RevealIcon>
        </SwipeReveal>
      )}

      <SwipeCard
        ref={cardRef}
        $springing={springing}
        $exitDir={exitDir}
        style={!springing && !exitDir ? { transform: `translateX(${offsetX}px)` } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={commit}
        onPointerCancel={commit}
      >
        {children}
      </SwipeCard>
    </SwipeRow>
  );
};
