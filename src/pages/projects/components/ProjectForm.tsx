import { useState } from 'react';
import type {
  ItemCategory,
  ProjectStashUsage,
  ProjectStatus,
} from '../../../types/models';
import { FormActions } from '../../../components/forms/FormActions';
import { FormField } from '../../../components/forms/FormField';
import { FormSection } from '../../../components/forms/FormSection';
import { SelectInput } from '../../../components/forms/SelectInput';
import { TextArea } from '../../../components/forms/TextArea';
import { TextInput } from '../../../components/forms/TextInput';

export type ProjectFormValues = {
  name: string;
  patternId: string;
  stashItemIds: string[];
  stashUsages: ProjectStashUsage[];
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  notes: string;
};

type PatternOption = {
  id: string;
  name: string;
};

type StashItemOption = {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit?: string;
};

type ProjectFormProps = {
  patternOptions: PatternOption[];
  stashItemOptions: StashItemOption[];
  initialValues?: Partial<ProjectFormValues>;
  submitLabel?: string;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel?: () => void;
  submitError?: string | null;
  isSubmitting?: boolean;
};

type FormErrors = Partial<Record<'name' | 'patternId' | 'status', string>>;

export function ProjectForm({
  patternOptions,
  stashItemOptions,
  initialValues,
  submitLabel = 'Save Project',
  onSubmit,
  onCancel,
  submitError = null,
  isSubmitting = false,
}: ProjectFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState<ProjectFormValues>({
    name: initialValues?.name ?? '',
    patternId: initialValues?.patternId ?? '',
    stashItemIds: initialValues?.stashItemIds ?? [],
    stashUsages: initialValues?.stashUsages ?? [],
    status: initialValues?.status ?? 'planned',
    startDate: initialValues?.startDate ?? '',
    endDate: initialValues?.endDate ?? '',
    notes: initialValues?.notes ?? '',
  });

  function update<K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));

    if (key === 'name' || key === 'patternId' || key === 'status') {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = 'Project name is required.';
    }

    if (!values.patternId) {
      nextErrors.patternId = 'A linked pattern is required.';
    }

    if (!values.status) {
      nextErrors.status = 'Status is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(values);
  }

  function toggleStashItem(stashItemId: string) {
    setValues((prev) => ({
      ...prev,
      stashItemIds: prev.stashItemIds.includes(stashItemId)
        ? prev.stashItemIds.filter((id) => id !== stashItemId)
        : [...prev.stashItemIds, stashItemId],
      stashUsages: prev.stashItemIds.includes(stashItemId)
        ? prev.stashUsages.filter((usage) => usage.stashItemId !== stashItemId)
        : [...prev.stashUsages, { stashItemId, quantityUsed: undefined }],
    }));
  }

  function updateUsageQuantity(stashItemId: string, quantityUsed: string) {
    setValues((prev) => ({
      ...prev,
      stashUsages: prev.stashUsages.map((usage) =>
        usage.stashItemId === stashItemId
          ? {
              ...usage,
              quantityUsed:
                quantityUsed === '' ? undefined : Number(quantityUsed),
            }
          : usage,
      ),
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      <FormSection title="Project Info">
        <FormField label="Name">
          <TextInput
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Project name"
          />
          {errors.name ? (
            <p className="text-sm text-rose-600">{errors.name}</p>
          ) : null}
        </FormField>

        <FormField label="Linked Pattern">
          <SelectInput
            value={values.patternId}
            onChange={(event) => update('patternId', event.target.value)}
          >
            <option value="">Select a pattern</option>
            {patternOptions.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.name}
              </option>
            ))}
          </SelectInput>
          {errors.patternId ? (
            <p className="text-sm text-rose-600">{errors.patternId}</p>
          ) : null}
        </FormField>

        <FormField label="Status">
          <SelectInput
            value={values.status}
            onChange={(event) =>
              update('status', event.target.value as ProjectStatus)
            }
          >
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="need-supplies">Need Supplies</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </SelectInput>
          {errors.status ? (
            <p className="text-sm text-rose-600">{errors.status}</p>
          ) : null}
        </FormField>
      </FormSection>

      <FormSection title="Dates">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date">
            <TextInput
              type="date"
              value={values.startDate}
              onChange={(event) => update('startDate', event.target.value)}
            />
          </FormField>

          <FormField label="End Date">
            <TextInput
              type="date"
              value={values.endDate}
              onChange={(event) => update('endDate', event.target.value)}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Linked Stash Items">
        {stashItemOptions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">
              Select the stash items that belong to this project.
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-3">
              {stashItemOptions.map((item) => {
                const isChecked = values.stashItemIds.includes(item.id);
                const usage = values.stashUsages.find(
                  (entry) => entry.stashItemId === item.id,
                );

                return (
                  <div
                    key={item.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent bg-white px-3 py-3 transition hover:border-rose-200"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStashItem(item.id)}
                        className="mt-1 h-4 w-4 rounded border-stone-300 text-rose-600 focus:ring-rose-300"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900">
                          {item.name}
                        </p>
                        <p className="text-sm text-stone-600">
                          {formatCategory(item.category)} • {item.quantity}{' '}
                          {item.unit ?? 'items'}
                        </p>
                      </div>
                    </label>

                    {isConsumableCategory(item.category) ? (
                      <div className="w-28 shrink-0">
                        <TextInput
                          type="number"
                          min="0"
                          disabled={!isChecked}
                          value={usage?.quantityUsed ?? ''}
                          onChange={(event) =>
                            updateUsageQuantity(item.id, event.target.value)
                          }
                          placeholder="Used"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="text-xs leading-5 text-stone-500">
              Usage quantities are only applied when the project is first marked
              completed. Hooks and needles are linked for reference only and are
              not decremented.
            </p>
          </div>
        ) : (
          <p className="text-sm text-stone-600">
            No stash items available yet.
          </p>
        )}
      </FormSection>

      <FormSection title="Notes">
        <FormField label="Notes">
          <TextArea
            value={values.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="Optional project notes"
          />
        </FormField>
      </FormSection>

      <FormActions
        submitLabel={submitLabel}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}

function formatCategory(category: ItemCategory) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function isConsumableCategory(category: ItemCategory) {
  return (
    category === 'yarn' ||
    category === 'eyes' ||
    category === 'stuffing' ||
    category === 'other'
  );
}
