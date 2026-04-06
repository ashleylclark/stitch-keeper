import { useState } from 'react';
import type {
  ItemCategory,
  Pattern,
  PatternRequirement,
  YarnWeight,
} from '../../../types/models';
import { FormActions } from '../../../components/forms/FormActions';
import { FormField } from '../../../components/forms/FormField';
import { FormSection } from '../../../components/forms/FormSection';
import { SelectInput } from '../../../components/forms/SelectInput';
import { TextArea } from '../../../components/forms/TextArea';
import { TextInput } from '../../../components/forms/TextInput';

export type PatternFormValues = {
  name: string;
  source: string;
  sourceUrl: string;
  category: NonNullable<Pattern['category']> | '';
  difficulty: NonNullable<Pattern['difficulty']> | '';
  notes: string;
  instructions: string;
  requirements: PatternRequirement[];
};

type RequirementFormValues = {
  category: ItemCategory;
  name: string;
  weight: YarnWeight | '';
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
  submitError?: string | null;
  isSubmitting?: boolean;
};

type FormErrors = Partial<Record<'name' | 'instructions', string>>;

const defaultRequirementUnits: Record<ItemCategory, string> = {
  yarn: 'yrds',
  hook: 'hook',
  needle: '',
  eyes: 'pairs',
  stuffing: 'bags',
  other: 'items',
};

const initialRequirementValues: RequirementFormValues = {
  category: 'yarn',
  name: '',
  weight: '',
  quantityNeeded: '',
  unit: defaultRequirementUnits.yarn,
  size: '',
  notes: '',
};

export function PatternForm({
  initialValues,
  submitLabel = 'Save Pattern',
  onSubmit,
  onCancel,
  submitError = null,
  isSubmitting = false,
}: PatternFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [requirementError, setRequirementError] = useState<string>();
  const [values, setValues] = useState<PatternFormValues>({
    name: initialValues?.name ?? '',
    source: initialValues?.source ?? '',
    sourceUrl: initialValues?.sourceUrl ?? '',
    category: initialValues?.category ?? '',
    difficulty: initialValues?.difficulty ?? '',
    notes: initialValues?.notes ?? '',
    instructions: initialValues?.instructions ?? '',
    requirements: initialValues?.requirements ?? [],
  });
  const [newRequirement, setNewRequirement] = useState<RequirementFormValues>(
    initialRequirementValues,
  );

  const showRequirementWeight = showsRequirementWeight(newRequirement.category);
  const showRequirementSize = showsRequirementSize(newRequirement.category);
  const showRequirementUnit = showsRequirementUnit(newRequirement.category);

  function update<K extends keyof PatternFormValues>(
    key: K,
    value: PatternFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));

    if (key === 'name' || key === 'instructions') {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function addRequirement() {
    if (!newRequirement.name.trim()) {
      setRequirementError('Requirement name is required.');
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
      requirements: prev.requirements.filter(
        (requirement) => requirement.id !== requirementId,
      ),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = 'Pattern name is required.';
    }

    if (!values.instructions.trim()) {
      nextErrors.instructions = 'Instructions are required.';
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
          {submitError}
        </div>
      ) : null}

      <FormSection title="Pattern Info">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Name">
            <TextInput
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Pattern name"
            />
            {errors.name ? (
              <p className="text-sm text-rose-600 dark:text-rose-300">
                {errors.name}
              </p>
            ) : null}
          </FormField>

          <FormField label="Category">
            <SelectInput
              value={values.category}
              onChange={(event) =>
                update(
                  'category',
                  event.target.value as PatternFormValues['category'],
                )
              }
            >
              <option value="">Select category</option>
              <option value="accessory">Accessory</option>
              <option value="amigurumi">Amigurumi</option>
              <option value="bag">Bag</option>
              <option value="blanket">Blanket</option>
              <option value="garment">Garment</option>
              <option value="home">Home</option>
              <option value="toy">Toy</option>
              <option value="other">Other</option>
            </SelectInput>
          </FormField>

          <FormField label="Difficulty">
            <SelectInput
              value={values.difficulty}
              onChange={(event) =>
                update(
                  'difficulty',
                  event.target.value as PatternFormValues['difficulty'],
                )
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
              onChange={(event) => update('source', event.target.value)}
              placeholder="Designer, book, website"
            />
          </FormField>

          <FormField label="Source URL">
            <TextInput
              type="url"
              value={values.sourceUrl}
              onChange={(event) => update('sourceUrl', event.target.value)}
              placeholder="https://"
            />
          </FormField>
        </div>

        <FormField label="Notes">
          <TextArea
            value={values.notes}
            onChange={(event) => update('notes', event.target.value)}
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
                  ...getNextRequirementValues(
                    prev,
                    event.target.value as ItemCategory,
                  ),
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
                setNewRequirement((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="Cotton yarn, 5 mm hook"
            />
            {requirementError ? (
              <p className="text-sm text-rose-600 dark:text-rose-300">
                {requirementError}
              </p>
            ) : null}
          </FormField>

          {showRequirementWeight ? (
            <FormField label="Weight">
              <SelectInput
                value={newRequirement.weight}
                onChange={(event) =>
                  setNewRequirement((prev) => ({
                    ...prev,
                    weight: event.target.value as YarnWeight | '',
                  }))
                }
              >
                <option value="">Select weight</option>
                <option value="lace">0 - Lace</option>
                <option value="super-fine">1 - Super Fine</option>
                <option value="fine">2 - Fine</option>
                <option value="light">3 - Light</option>
                <option value="medium">4 - Medium</option>
                <option value="bulky">5 - Bulky</option>
                <option value="super-bulky">6 - Super Bulky</option>
                <option value="jumbo">7 - Jumbo</option>
              </SelectInput>
            </FormField>
          ) : null}

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

          {showRequirementUnit ? (
            <FormField label="Unit">
              <TextInput
                value={newRequirement.unit}
                onChange={(event) =>
                  setNewRequirement((prev) => ({
                    ...prev,
                    unit: event.target.value,
                  }))
                }
                placeholder={getRequirementUnitPlaceholder(
                  newRequirement.category,
                )}
              />
            </FormField>
          ) : null}

          {showRequirementSize ? (
            <FormField label="Size">
              <TextInput
                value={newRequirement.size}
                onChange={(event) =>
                  setNewRequirement((prev) => ({
                    ...prev,
                    size: event.target.value,
                  }))
                }
                placeholder="5 mm, 12 mm"
              />
            </FormField>
          ) : null}
        </div>

        <FormField label="Notes">
          <TextInput
            value={newRequirement.notes}
            onChange={(event) =>
              setNewRequirement((prev) => ({
                ...prev,
                notes: event.target.value,
              }))
            }
            placeholder="Optional requirement details"
          />
        </FormField>

        <button
          type="button"
          onClick={addRequirement}
          className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 dark:border-stone-700 dark:text-stone-200"
        >
          Add Requirement
        </button>

        <ul className="space-y-2">
          {values.requirements.map((requirement) => (
            <li
              key={requirement.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200"
            >
              <span>
                <span className="font-medium capitalize">
                  {requirement.category}:
                </span>{' '}
                {requirement.name}
              </span>

              <button
                type="button"
                onClick={() => removeRequirement(requirement.id)}
                className="cursor-pointer text-sm text-red-600 dark:text-rose-300"
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
            onChange={(event) => update('instructions', event.target.value)}
            placeholder="Paste or type the pattern instructions here."
            className="min-h-64 resize-y"
          />
          <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">
            Put each round or step on its own line to make it trackable inside
            linked projects.
          </p>
          {errors.instructions ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">
              {errors.instructions}
            </p>
          ) : null}
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

function getNextRequirementValues(
  previous: RequirementFormValues,
  category: ItemCategory,
): RequirementFormValues {
  return {
    ...previous,
    category,
    unit: defaultRequirementUnits[category],
    weight: showsRequirementWeight(category) ? previous.weight : '',
    size: showsRequirementSize(category) ? previous.size : '',
  };
}

function showsRequirementWeight(category: ItemCategory) {
  return category === 'yarn';
}

function showsRequirementSize(category: ItemCategory) {
  return category === 'hook' || category === 'needle' || category === 'eyes';
}

function showsRequirementUnit(category: ItemCategory) {
  return (
    category === 'yarn' ||
    category === 'stuffing' ||
    category === 'eyes' ||
    category === 'other'
  );
}

function getRequirementUnitPlaceholder(category: ItemCategory) {
  return defaultRequirementUnits[category] || 'items';
}
