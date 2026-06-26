import { useLayoutEffect, useState, type RefObject } from 'react';

export interface FloatingPosition {
  top: number;
  left: number;
}

/**
 * Computes fixed-position viewport coordinates for a floating panel anchored
 * to a trigger element. Rendering the panel via a portal at these coordinates
 * (instead of `position: absolute` inside the trigger's own DOM tree) avoids
 * it being clipped by an ancestor's `overflow-hidden`/`overflow-y-auto` (e.g.
 * a scrollable modal body) and avoids RTL/LTR-dependent `left-0`/`right-0`
 * math pushing it off-screen — the position is computed from real pixel
 * coordinates, not logical direction.
 */
export function useFloatingPosition(
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
): FloatingPosition | null {
  const [pos, setPos] = useState<FloatingPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger) return;

    function compute() {
      const rect = trigger!.getBoundingClientRect();
      const panelW = panelRef.current?.offsetWidth ?? 320;
      const panelH = panelRef.current?.offsetHeight ?? 380;
      const margin = 8;

      let left = rect.right - panelW;
      if (left < margin) left = rect.left;
      left = Math.min(Math.max(left, margin), window.innerWidth - panelW - margin);

      let top = rect.bottom + 6;
      if (top + panelH > window.innerHeight - margin) {
        const above = rect.top - panelH - 6;
        top = above >= margin ? above : margin;
      }

      setPos({ top, left });
    }

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open, triggerRef, panelRef]);

  return pos;
}
