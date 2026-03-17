import { useState } from "react";
import type {
  ItemCategory,
  Pattern,
  PatternRequirement,
  YarnWeight,
} from '../../../types/models'
import { FormActions } from '../../../components/forms/FormActions'
import { FormField } from '../../../components/forms/FormField'
import { FormSection } from '../../../components/forms/FormSection'
import { SelectInput } from '../../../components/forms/SelectInput'
import { TextArea } from '../../../components/forms/TextArea'
import { TextInput } from '../../../components/forms/TextInput'

export type PatternFormValues = {
  name: string;
  source: string;
  sourceUrl: string;
  category: NonNullable<Pattern["category"]> | "";
  difficulty: NonNullable<Pattern["difficulty"]> | "";
  notes: string;
  instructions: string;
  requirements: PatternRequirement[];
};

type RequirementFormValues = {
  category: ItemCategory;
  name: string;
  weight: YarnWeight | "";
  quantityNeeded: string;
  unit: string;
  size: string;
  notes: string;
};

type PatternFormProps = {
  initialValues?: Partial<PatternFormValues>;
  submitLabel?: string;
  onSubmit: (values: PatternFormValues) => void;
  onCancel?: () => void;
};

type FormErrors = Partial<Record<"name" | "instructions", string>>;

const initialRequirementValues: RequirementFormValues = {
  category: "yarn",
  name: "",
  weight: "",
  quantityNeeded: "",
  unit: "",
  size: "",
  notes: "",
};

export function PatternForm({
  initialValues,
  submitLabel = "Save Pattern",
  onSubmit,
  onCancel,
}: PatternFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [requirementError, setRequirementError] = useState<string>();
  const [values, setValues] = useState<PatternFormValues>({
    name: initialValues?.name ?? "",
    source: initialValues?.source ?? "",
    sourceUrl: initialValues?.sourceUrl ?? "",
    category: initialValues?.category ?? "",
    difficulty: initialValues?.difficulty ?? "",
    notes: initialValues?.notes ?? "",
    instructions: initialValues?.instructions ?? "",
    requirements: initialValues?.requirements ?? [],
  });
  const [newRequirement, setNewRequirement] =
    useState<RequirementFormValues>(initialRequirementValues);

  function update<K extends keyof PatternFormValues>(key: K, value: PatternFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));

    if (key === "name" || key === "instructions") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function addRequirement() {
    if (!newRequirement.name.trim()) {
      setRequirementError("Requirement name is required.");
      return;
    }

    const nextRequirement: PatternRequirement = {
      id: `requirement-${Date.now()}`,
      category: newRequirement.category,
      name: newRequirement.name.trim(),
      weight: newRequirement.weight || undefined,
      quantityNeeded: newRequirement.quantityNeeded
        ? Number(newRequirement.quantityNeeded)
        : undefined,
      unit: newRequirement.unit.trim() || undefined,
      size: newRequirement.size.trim() || undefined,
      notes: newRequirement.notes.trim() || undefined,
    };

    setValues((prev) => ({
      ...prev,
      requirements: [...prev.requirements, nextRequirement],
    }));
    setNewRequirement(initialRequirementValues);
    setRequirementError(undefined);
  }

  function removeRequirement(requirementId: string) {
    setValues((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((requirement) => requirement.id !== requirementId),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Pattern name is required.";
    }

    if (!values.instructions.trim()) {
      nextErrors.instructions = "Instructions are required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormSection title="Pattern Info">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Name">
            <TextInput
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Pattern name"
            />
            {errors.name ? <p className="text-sm text-rose-600">{errors.name}</p> : null}
          </FormField>

          <FormField label="Category">
            <SelectInput
              value={values.category}
              onChange={(event) =>
                update("category", event.target.value as PatternFormValues["category"])
              }
            >
              <option value="">Select category</option>
              <option value="accessory">Accessory</option>
              <option value="bag">Bag</option>
              <option value="blanket">Blanket</option>
              <option value="garment">Garment</option>
              <option value="home">Home</option>
            </SelectInput>
          </FormField>

          <FormField label="Difficulty">
            <SelectInput
              value={values.difficulty}
              onChange={(event) =>
                update("difficulty", event.target.value as PatternFormValues["difficulty"])
              }
            >
              <option value="">Select difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </SelectInput>
          </FormField>

          <FormField label="Source">
            <TextInput
              value={values.source}
              onChange={(event) => update("source", event.target.value)}
              placeholder="Designer, book, website"
            />
          </FormField>

          <FormField label="Source URL">
            <TextInput
              type="url"
              value={values.sourceUrl}
              onChange={(event) => update("sourceUrl", event.target.value)}
              placeholder="https://"
            />
          </FormField>
        </div>

        <FormField label="Notes">
          <TextArea
            value={values.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Optional notes about the pattern"
          />
        </FormField>
      </FormSection>

      <FormSection title="Requirements">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Category">
            <SelectInput
              value={newRequirement.category}
              onChange={(event) =>
                setNewRequirement((prev) => ({
                  ...prev,
                  category: event.target.value as ItemCategory,
                }))
              }
            >
              <option value="yarn">Yarn</option>
              <option value="hook">Hook</option>
              <option value="needle">Needle</option>
              <option value="eyes">Safety Eyes</option>
              <option value="stuffing">Stuffing</option>
              <option value="other">Other</option>
            </SelectInput>
          </FormField>

          <FormField label="Requirement Name">
            <TextInput
              value={newRequirement.name}
              onChange={(event) =>
                setNewRequirement((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Cotton yarn, 5 mm hook"
            />
            {requirementError ? <p className="text-sm text-rose-600">{requirementError}</p> : null}
          </FormField>

          <FormField label="Weight">
            <SelectInput
              value={newRequirement.weight}
              onChange={(event) =>
                setNewRequirement((prev) => ({
                  ...prev,
                  weight: event.target.value as YarnWeight | "",
                }))
              }
            >
              <option value="">Select weight</option>
              <option value="lace">Lace</option>
              <option value="fingering">Fingering</option>
              <option value="sport">Sport</option>
              <option value="dk">DK</option>
              <option value="worsted">Worsted</option>
              <option value="bulky">Bulky</option>
              <option value="super-bulky">Super Bulky</option>
            </SelectInput>
          </FormField>

          <FormField label="Quantity Needed">
            <TextInput
              type="number"
              min="0"
              value={newRequirement.quantityNeeded}
              onChange={(event) =>
                setNewRequirement((prev) => ({
                  ...prev,
                  quantityNeeded: event.target.value,
                }))
              }
              placeholder="0"
            />
          </FormField>

          <FormField label="Unit">
            <TextInput
              value={newRequirement.unit}
              onChange={(event) =>
                setNewRequirement((prev) => ({ ...prev, unit: event.target.value }))
              }
              placeholder="skeins, pairs"
            />
          </FormField>

          <FormField label="Size">
            <TextInput
              value={newRequirement.size}
              onChange={(event) =>
                setNewRequirement((prev) => ({ ...prev, size: event.target.value }))
              }
              placeholder="5 mm, 12 mm"
            />
          </FormField>
        </div>

        <FormField label="Notes">
          <TextInput
            value={newRequirement.notes}
            onChange={(event) =>
              setNewRequirement((prev) => ({ ...prev, notes: event.target.value }))
            }
            placeholder="Optional requirement details"
          />
        </FormField>

        <button
          type="button"
          onClick={addRequirement}
          className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
        >
          Add Requirement
        </button>

        <ul className="space-y-2">
          {values.requirements.map((requirement) => (
            <li
              key={requirement.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium capitalize">{requirement.category}:</span>{" "}
                {requirement.name}
              </span>

              <button
                type="button"
                onClick={() => removeRequirement(requirement.id)}
                className="cursor-pointer text-sm text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </FormSection>

      <FormSection title="Instructions">
        <FormField label="Instructions">
          <TextArea
            value={values.instructions}
            onChange={(event) => update("instructions", event.target.value)}
            placeholder="Paste or type the pattern instructions here."
          />
          {errors.instructions ? (
            <p className="text-sm text-rose-600">{errors.instructions}</p>
          ) : null}
        </FormField>
      </FormSection>

      <FormActions submitLabel={submitLabel} onCancel={onCancel} />
    </form>
  );
}
