type FormActionsProps = {
  submitLabel: string;
  onCancel?: () => void;
};

export function FormActions({ submitLabel, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      )}

      <button
        type="submit"
        className="cursor-pointer rounded-lg bg-stone-800 px-4 py-2 text-sm text-white"
      >
        {submitLabel}
      </button>
    </div>
  );
}
