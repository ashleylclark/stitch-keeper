import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
};

export function Modal({
  title,
  isOpen,
  onClose,
  children,
  maxWidthClassName = 'max-w-2xl',
}: ModalProps) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex h-dvh max-h-dvh bg-black/40 backdrop-blur-[2px] dark:bg-black/60 lg:items-center lg:p-6">
      <div
        className={`mx-auto flex h-dvh w-full flex-col overflow-hidden rounded-none bg-white shadow-xl dark:bg-stone-900 dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.75)] lg:h-auto lg:max-h-[calc(100dvh-3rem)] lg:rounded-2xl ${maxWidthClassName}`}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-5 py-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
