import { useState } from 'react';
import type {
  ItemCategory,
  StashCategory,
  StashStatus,
  YarnWeight,
} from '../../../types/models';
import { FormActions } from '../../../components/forms/FormActions';
import { FormField } from '../../../components/forms/FormField';
import { FormSection } from '../../../components/forms/FormSection';
import { SelectInput } from '../../../components/forms/SelectInput';
import { TextArea } from '../../../components/forms/TextArea';
import { TextInput } from '../../../components/forms/TextInput';
import {
  getActiveCategories,
  getCategory,
  getDefaultUnit,
} from '../lib/categories';

export type StashFormValues = {
  category: ItemCategory;
  name: string;
  quantity: number | '';
  status: StashStatus;
  unit: string;
  brand: string;
  color: string;
  weight: YarnWeight | '';
  size: string;
  material: string;
  notes: string;
};

type StashFormProps = {
  categories: StashCategory[];
  initialValues?: Partial<StashFormValues>;
  submitLabel?: string;
  onSubmit: (values: StashFormValues) => void;
  onCreateCategory?: (
    nameSingular: string,
    namePlural: string,
  ) => Promise<StashCategory>;
  onCancel?: () => void;
  submitError?: string | null;
  isSubmitting?: boolean;
};

type FormErrors = Partial<Record<'name' | 'quantity', string>>;

export function StashForm({
  categories,
  initialValues,
  submitLabel = 'Save Stash Item',
  onSubmit,
  onCreateCategory,
  onCancel,
  submitError = null,
  isSubmitting = false,
}: StashFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState({
    nameSingular: '',
    namePlural: '',
  });
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const initialCategory =
    initialValues?.category ?? categories.find((category) => !category.archivedAt)?.id ?? 'yarn';
  const [values, setValues] = useState<StashFormValues>({
    category: initialCategory,
    name: initialValues?.name ?? '',
    quantity: initialValues?.quantity ?? '',
    status: initialValues?.status ?? 'in-stock',
    unit:
      initialValues?.unit ??
      getDefaultUnit(getCategory(initialCategory, categories)),
    brand: initialValues?.brand ?? '',
    color: initialValues?.color ?? '',
    weight: initialValues?.weight ?? '',
    size: initialValues?.size ?? '',
    material: initialValues?.material ?? '',
    notes: initialValues?.notes ?? '',
  });

  function update<K extends keyof StashFormValues>(
    key: K,
    value: StashFormValues[K],
  ) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };

      if (key === 'category') {
        const category = value as ItemCategory;
        const categoryConfig = getCategory(category, categories);
        next.unit = getDefaultUnit(categoryConfig);

        if (!showsWeight(categoryConfig)) next.weight = '';
        if (!showsBrand(categoryConfig)) next.brand = '';
        if (!showsColor(categoryConfig)) next.color = '';
        if (!showsSize(categoryConfig)) next.size = '';
        if (!showsMaterial(categoryConfig)) next.material = '';
        if (!showsNotes(categoryConfig)) next.notes = '';
      }

      if (key === 'quantity') {
        const quantity = value === '' ? undefined : Number(value);

        if (quantity === 0 && next.status !== 'not-replacing') {
          next.status = 'out-of-stock';
        }
      }

      return next;
    });

    if (key === 'name' || key === 'quantity') {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (values.quantity === '' || Number.isNaN(Number(values.quantity))) {
      nextErrors.quantity = 'Quantity is required.';
    } else if (Number(values.quantity) < 0) {
      nextErrors.quantity = 'Quantity must be zero or more.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(values);
  }

  async function handleCreateCategory() {
    if (!onCreateCategory) {
      return;
    }

    if (!categoryDraft.nameSingular.trim() || !categoryDraft.namePlural.trim()) {
      setCategoryError('Singular and plural names are required.');
      return;
    }

    setCategoryError(null);
    setIsCreatingCategory(true);

    try {
      const category = await onCreateCategory(
        categoryDraft.nameSingular,
        categoryDraft.namePlural,
      );
      update('category', category.id);
      setCategoryDraft({ nameSingular: '', namePlural: '' });
      setIsAddingCategory(false);
    } catch (error) {
      setCategoryError(
        error instanceof Error
          ? error.message
          : 'Unable to create category.',
      );
    } finally {
      setIsCreatingCategory(false);
    }
  }

  const categoryConfig = getCategory(values.category, categories);
  const categoryOptions = getActiveCategories(categories, values.category);
  const showBrand = showsBrand(categoryConfig);
  const showColor = showsColor(categoryConfig);
  const showWeight = showsWeight(categoryConfig);
  const showSize = showsSize(categoryConfig);
  const showMaterial = showsMaterial(categoryConfig);
  const showUnit = showsUnit(categoryConfig);
  const showNotes = showsNotes(categoryConfig);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
          {submitError}
        </div>
      ) : null}

      <FormSection title="Basic Info">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Category">
            <div className="space-y-3">
              <SelectInput
                value={values.category}
                onChange={(event) =>
                  update('category', event.target.value as ItemCategory)
                }
              >
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameSingular}
                    {category.archivedAt ? ' (archived)' : ''}
                  </option>
                ))}
              </SelectInput>

              {onCreateCategory ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory((current) => !current)}
                  className="text-sm font-semibold text-rose-600 transition hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                >
                  {isAddingCategory ? 'Cancel new category' : 'Add category'}
                </button>
              ) : null}
            </div>
          </FormField>

          <FormField label="Name">
            <TextInput
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Item name"
            />
            {errors.name ? (
              <p className="text-sm text-rose-600 dark:text-rose-300">
                {errors.name}
              </p>
            ) : null}
          </FormField>

          <FormField label="Quantity">
            <TextInput
              type="number"
              min="0"
              value={values.quantity}
              onChange={(event) =>
                update(
                  'quantity',
                  event.target.value === '' ? '' : Number(event.target.value),
                )
              }
              placeholder="0"
            />
            {errors.quantity ? (
              <p className="text-sm text-rose-600 dark:text-rose-300">
                {errors.quantity}
              </p>
            ) : null}
          </FormField>

          <FormField label="Status">
            <SelectInput
              value={values.status}
              onChange={(event) =>
                update('status', event.target.value as StashStatus)
              }
            >
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="not-replacing">Not Replacing</option>
            </SelectInput>
          </FormField>

          {showUnit ? (
            <FormField label="Unit">
              <TextInput
                value={values.unit}
                onChange={(event) => update('unit', event.target.value)}
                placeholder="yrdss, bags, items"
              />
            </FormField>
          ) : null}
        </div>
      </FormSection>

      {isAddingCategory ? (
        <FormSection title="New Category">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Singular name">
              <TextInput
                value={categoryDraft.nameSingular}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    nameSingular: event.target.value,
                  }))
                }
                placeholder="Button"
              />
            </FormField>

            <FormField label="Plural name">
              <TextInput
                value={categoryDraft.namePlural}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    namePlural: event.target.value,
                  }))
                }
                placeholder="Buttons"
              />
            </FormField>
          </div>
          {categoryError ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">
              {categoryError}
            </p>
          ) : null}
          <button
            type="button"
            disabled={isCreatingCategory}
            onClick={handleCreateCategory}
            className="inline-flex w-fit items-center justify-center rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-400 dark:text-stone-950 dark:hover:bg-rose-300"
          >
            {isCreatingCategory ? 'Adding...' : 'Add Category'}
          </button>
        </FormSection>
      ) : null}

      {showBrand || showColor || showWeight || showSize || showMaterial ? (
        <FormSection title="Item Details">
          <div className="grid gap-3 sm:grid-cols-2">
            {showBrand ? (
              <FormField label="Brand">
                <TextInput
                  value={values.brand}
                  onChange={(event) => update('brand', event.target.value)}
                  placeholder="Brand name"
                />
              </FormField>
            ) : null}

            {showColor ? (
              <FormField label="Color">
                <TextInput
                  value={values.color}
                  onChange={(event) => update('color', event.target.value)}
                  placeholder="Color name"
                />
              </FormField>
            ) : null}

            {showWeight ? (
              <FormField label="Yarn Weight">
                <SelectInput
                  value={values.weight}
                  onChange={(event) =>
                    update('weight', event.target.value as YarnWeight | '')
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

            {showSize ? (
              <FormField label="Size">
                <TextInput
                  value={values.size}
                  onChange={(event) => update('size', event.target.value)}
                  placeholder="4 mm, 12 mm"
                />
              </FormField>
            ) : null}

            {showMaterial ? (
              <FormField label="Material">
                <TextInput
                  value={values.material}
                  onChange={(event) => update('material', event.target.value)}
                  placeholder="Steel, bamboo, polyester"
                />
              </FormField>
            ) : null}
          </div>
        </FormSection>
      ) : null}

      {showNotes ? (
        <FormSection title="Notes">
          <FormField label="Notes">
            <TextArea
              value={values.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="Optional item notes"
            />
          </FormField>
        </FormSection>
      ) : null}

      <FormActions
        submitLabel={submitLabel}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}

function showsWeight(category?: StashCategory) {
  return Boolean(category?.showWeight);
}

function showsBrand(category?: StashCategory) {
  return Boolean(category?.showBrand);
}

function showsColor(category?: StashCategory) {
  return Boolean(category?.showColor);
}

function showsSize(category?: StashCategory) {
  return Boolean(category?.showSize);
}

function showsMaterial(category?: StashCategory) {
  return Boolean(category?.showMaterial);
}

function showsUnit(category?: StashCategory) {
  return Boolean(category?.showUnit);
}

function showsNotes(category?: StashCategory) {
  return Boolean(category?.showNotes);
}
