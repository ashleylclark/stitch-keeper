import { useState } from "react";
import type { ProjectStatus } from '../../../types/models'
import { FormActions } from '../../../components/forms/FormActions'
import { FormField } from '../../../components/forms/FormField'
import { FormSection } from '../../../components/forms/FormSection'
import { SelectInput } from '../../../components/forms/SelectInput'
import { TextArea } from '../../../components/forms/TextArea'
import { TextInput } from '../../../components/forms/TextInput'

export type ProjectFormValues = {
  name: string;
  patternId: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  notes: string;
};

type PatternOption = {
  id: string;
  name: string;
};

type ProjectFormProps = {
  patternOptions: PatternOption[]
  initialValues?: Partial<ProjectFormValues>
  submitLabel?: string
  onSubmit: (values: ProjectFormValues) => void
  onCancel?: () => void
  submitError?: string | null
  isSubmitting?: boolean
}

type FormErrors = Partial<Record<"name" | "patternId" | "status", string>>;

export function ProjectForm({
  patternOptions,
  initialValues,
  submitLabel = "Save Project",
  onSubmit,
  onCancel,
  submitError = null,
  isSubmitting = false,
}: ProjectFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState<ProjectFormValues>({
    name: initialValues?.name ?? "",
    patternId: initialValues?.patternId ?? "",
    status: initialValues?.status ?? "planned",
    startDate: initialValues?.startDate ?? "",
    endDate: initialValues?.endDate ?? "",
    notes: initialValues?.notes ?? "",
  });

  function update<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));

    if (key === "name" || key === "patternId" || key === "status") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Project name is required.";
    }

    if (!values.patternId) {
      nextErrors.patternId = "A linked pattern is required.";
    }

    if (!values.status) {
      nextErrors.status = "Status is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(values);
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
            onChange={(event) => update("name", event.target.value)}
            placeholder="Project name"
          />
          {errors.name ? <p className="text-sm text-rose-600">{errors.name}</p> : null}
        </FormField>

        <FormField label="Linked Pattern">
          <SelectInput
            value={values.patternId}
            onChange={(event) => update("patternId", event.target.value)}
          >
            <option value="">Select a pattern</option>
            {patternOptions.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.name}
              </option>
            ))}
          </SelectInput>
          {errors.patternId ? <p className="text-sm text-rose-600">{errors.patternId}</p> : null}
        </FormField>

        <FormField label="Status">
          <SelectInput
            value={values.status}
            onChange={(event) => update("status", event.target.value as ProjectStatus)}
          >
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="need-supplies">Need Supplies</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </SelectInput>
          {errors.status ? <p className="text-sm text-rose-600">{errors.status}</p> : null}
        </FormField>
      </FormSection>

      <FormSection title="Dates">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date">
            <TextInput
              type="date"
              value={values.startDate}
              onChange={(event) => update("startDate", event.target.value)}
            />
          </FormField>

          <FormField label="End Date">
            <TextInput
              type="date"
              value={values.endDate}
              onChange={(event) => update("endDate", event.target.value)}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Notes">
        <FormField label="Notes">
          <TextArea
            value={values.notes}
            onChange={(event) => update("notes", event.target.value)}
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
  )
}
