import { Modal } from './Modal';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
  error?: string | null;
  isConfirming?: boolean;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
  error = null,
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onCancel}
      maxWidthClassName="max-w-lg"
    >
      <div className="space-y-6">
        <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
          {description}
        </p>
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isConfirming}
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-rose-200 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:hover:border-rose-400 dark:hover:text-stone-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
            className={[
              'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition',
              tone === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-stone-900 hover:bg-stone-800',
              'disabled:cursor-not-allowed disabled:opacity-60',
            ].join(' ')}
          >
            {isConfirming ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
