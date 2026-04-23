import { useState } from 'react';
import type {
  ItemCategory,
  Pattern,
  PatternInstructionSection,
  PatternRequirement,
  YarnWeight,
} from '../../../types/models';
import { FormActions } from '../../../components/forms/FormActions';
import { FormField } from '../../../components/forms/FormField';
import { FormSection } from '../../../components/forms/FormSection';
import { SelectInput } from '../../../components/forms/SelectInput';
import { TextArea } from '../../../components/forms/TextArea';
import { TextInput } from '../../../components/forms/TextInput';
import {
  createInstructionSection,
  createStepsFromText,
  deriveInstructionsFromSections,
  getInstructionStepsText,
  getPatternInstructionSections,
  normalizeInstructionSections,
} from '../lib/instructionSections';

export type PatternFormValues = {
  name: string;
  source: string;
  sourceUrl: string;
  category: NonNullable<Pattern['category']> | '';
  difficulty: NonNullable<Pattern['difficulty']> | '';
  notes: string;
  instructions: string;
  instructionSections: PatternInstructionSection[];
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

type FormErrors = Partial<Record<'name' | 'instructionSections', string>>;

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
    instructionSections: getPatternInstructionSections({
      instructions: initialValues?.instructions,
      instructionSections: initialValues?.instructionSections,
    }),
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

    if (key === 'name' || key === 'instructionSections') {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function updateInstructionSection(
    sectionId: string,
    nextValues: Partial<PatternInstructionSection>,
  ) {
    update(
      'instructionSections',
      values.instructionSections.map((section) =>
        section.id === sectionId ? { ...section, ...nextValues } : section,
      ),
    );
  }

  function addInstructionSection() {
    update('instructionSections', [
      ...values.instructionSections,
      createInstructionSection(values.instructionSections.length),
    ]);
  }

  function removeInstructionSection(sectionId: string) {
    if (values.instructionSections.length === 1) {
      update('instructionSections', [createInstructionSection(0)]);
      return;
    }

    update(
      'instructionSections',
      values.instructionSections.filter((section) => section.id !== sectionId),
    );
  }

  function moveInstructionSection(sectionId: string, direction: -1 | 1) {
    const currentIndex = values.instructionSections.findIndex(
      (section) => section.id === sectionId,
    );
    const nextIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= values.instructionSections.length
    ) {
      return;
    }

    const nextSections = [...values.instructionSections];
    const [section] = nextSections.splice(currentIndex, 1);
    nextSections.splice(nextIndex, 0, section);
    update('instructionSections', nextSections);
  }

  function updateInstructionStepsFromText(sectionId: string, text: string) {
    update(
      'instructionSections',
      values.instructionSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              steps: createStepsFromText(text),
            }
          : section,
      ),
    );
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

    const normalizedInstructionSections = normalizeInstructionSections(
      values.instructionSections,
    );

    if (
      normalizedInstructionSections.length === 0 ||
      normalizedInstructionSections.every(
        (section) => section.steps.length === 0,
      )
    ) {
      nextErrors.instructionSections = 'Add at least one instruction step.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      ...values,
      instructions: deriveInstructionsFromSections(
        normalizedInstructionSections,
      ),
      instructionSections: normalizedInstructionSections,
    });
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
        <div className="space-y-4">
          <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">
            Organize the pattern into sections like Body, Sleeves, or Neckline.
            Section notes are shown as reference text, and each non-empty line
            in a section becomes a trackable step inside linked projects.
          </p>

          {errors.instructionSections ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">
              {errors.instructionSections}
            </p>
          ) : null}

          {values.instructionSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-950"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-3">
                  <FormField label={`Section ${sectionIndex + 1} title`}>
                    <TextInput
                      value={section.title}
                      onChange={(event) =>
                        updateInstructionSection(section.id, {
                          title: event.target.value,
                        })
                      }
                      placeholder="Body, Sleeves, Neckline"
                    />
                  </FormField>

                  <FormField label="Section notes">
                    <TextArea
                      value={section.notes ?? ''}
                      onChange={(event) =>
                        updateInstructionSection(section.id, {
                          notes: event.target.value,
                        })
                      }
                      placeholder="Optional setup notes, stitch counts, or reminders."
                      className="min-h-20"
                    />
                  </FormField>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveInstructionSection(section.id, -1)}
                    disabled={sectionIndex === 0}
                    className="cursor-pointer rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:text-stone-200"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveInstructionSection(section.id, 1)}
                    disabled={
                      sectionIndex === values.instructionSections.length - 1
                    }
                    className="cursor-pointer rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:text-stone-200"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeInstructionSection(section.id)}
                    className="cursor-pointer rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 dark:border-rose-500/40 dark:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <FormField label="Steps">
                  <TextArea
                    value={getInstructionStepsText(section.steps)}
                    onChange={(event) =>
                      updateInstructionStepsFromText(
                        section.id,
                        event.target.value,
                      )
                    }
                    placeholder="Paste this section here with one step or round per line."
                    className="min-h-48 resize-y"
                  />
                </FormField>
                <p className="text-xs leading-6 text-stone-500 dark:text-stone-400">
                  {section.steps.filter((step) => step.text.trim()).length}{' '}
                  steps detected from line breaks.
                </p>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addInstructionSection}
            className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 dark:border-stone-700 dark:text-stone-200"
          >
            Add Section
          </button>
        </div>
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
