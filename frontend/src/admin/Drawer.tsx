import { useEffect, useRef, type ReactNode } from 'react';

// Open drawers and modals, topmost last. Esc closes only the topmost one.
const stack: (() => void)[] = [];
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && stack.length) stack[stack.length - 1](); };

/** Side panel (or centred modal) with a dimmed backdrop. Esc or the backdrop closes it. */
export function Drawer({ onClose, labelledBy, children, modal = false }: { onClose(): void; labelledBy: string; children: ReactNode; modal?: boolean }) {
  const ref = useRef<HTMLElement | null>(null);
  const setRef = (el: HTMLElement | null) => { ref.current = el; };
  useEffect(() => {
    stack.push(onClose);
    if (stack.length === 1) { document.addEventListener('keydown', onKey); document.body.classList.add('no-scroll'); }
    ref.current?.querySelector<HTMLElement>('[data-autofocus],[data-close]')?.focus({ preventScroll: true });
    return () => {
      stack.splice(stack.indexOf(onClose), 1);
      if (!stack.length) { document.removeEventListener('keydown', onKey); document.body.classList.remove('no-scroll'); }
    };
  }, [onClose]);
  return (
    <div className={'pt-drawer-wrap open' + (modal ? ' pt-modal-wrap' : '')}>
      <div className="pt-scrim" onClick={onClose} />
      {modal
        ? <div className="pt-modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={setRef}>{children}</div>
        : <aside className="pt-drawer" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={setRef}>{children}</aside>}
    </div>
  );
}
