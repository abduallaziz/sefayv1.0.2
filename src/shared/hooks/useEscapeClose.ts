import { useEffect, useRef } from 'react';

// One global stack so that, with stacked modals, Escape closes only the
// topmost one (the one that opened last), never everything at once.
const stack: symbol[] = [];

/**
 * Closes a modal on Escape. Pass `enabled=false` while a nested ConfirmDialog
 * (which handles its own Escape) is open so the parent does not close too.
 */
export function useEscapeClose(open: boolean, onClose: () => void, enabled = true) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open || !enabled) return;
    const id = Symbol('modal');
    stack.push(id);
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || stack[stack.length - 1] !== id) return;
      e.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [open, enabled]);
}
