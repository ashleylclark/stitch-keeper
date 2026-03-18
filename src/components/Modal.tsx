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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px] dark:bg-black/60 sm:p-6">
      <div
        className={`mx-auto mt-4 w-full rounded-2xl bg-white shadow-xl dark:bg-stone-900 dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.75)] sm:mt-8 ${maxWidthClassName}`}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-stone-800">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
