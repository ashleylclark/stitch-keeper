type FormActionsProps = {
  submitLabel: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

export function FormActions({
  submitLabel,
  onCancel,
  isSubmitting = false,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      {onCancel && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:text-stone-200"
        >
          Cancel
        </button>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="cursor-pointer rounded-lg bg-stone-800 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-400 dark:text-stone-950"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}
