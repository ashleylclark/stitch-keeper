type FormActionsProps = {
  submitLabel: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  sticky?: boolean;
};

export function FormActions({
  submitLabel,
  onCancel,
  isSubmitting = false,
  sticky = false,
}: FormActionsProps) {
  const cancelClassName = sticky
    ? 'min-h-10 flex-1 cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:text-stone-200 sm:flex-none'
    : 'cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:text-stone-200';
  const submitClassName = sticky
    ? 'min-h-10 flex-1 cursor-pointer rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-accent-400 dark:text-stone-950 sm:flex-none'
    : 'cursor-pointer rounded-lg bg-stone-800 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-accent-400 dark:text-stone-950';

  return (
    <div
      className={[
        'flex',
        sticky
          ? 'sticky bottom-3 z-10 mx-auto mt-auto w-full max-w-lg justify-center gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-[0_-14px_40px_-28px_rgba(41,37,36,0.65),0_12px_32px_-24px_rgba(41,37,36,0.45)] dark:border-stone-700 dark:bg-stone-900 dark:shadow-[0_-14px_44px_-28px_rgba(0,0,0,0.9),0_12px_32px_-24px_rgba(0,0,0,0.8)]'
          : 'justify-end gap-2 pt-2',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {onCancel && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className={cancelClassName}
        >
          Cancel
        </button>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={submitClassName}
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}
