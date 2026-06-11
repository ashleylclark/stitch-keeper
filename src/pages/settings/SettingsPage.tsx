import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Modal } from '../../components/Modal';
import { FormActions } from '../../components/forms/FormActions';
import { FormField } from '../../components/forms/FormField';
import { FormSection } from '../../components/forms/FormSection';
import { TextInput } from '../../components/forms/TextInput';
import { useAppData } from '../../app/state/app-data';
import type {
  ColorTheme,
  StashCategory,
  Theme,
  UserSettings,
} from '../../types/models';
import type { StashCategoryInput } from '../stash/api';
import { otherLikeCategoryDefaults } from '../stash/lib/categories';

type CategoryFormValues = {
  nameSingular: string;
  namePlural: string;
  defaultUnit: string;
  showWeight: boolean;
  showBrand: boolean;
  showColor: boolean;
  showSize: boolean;
  showMaterial: boolean;
  showUnit: boolean;
  showNotes: boolean;
  isConsumable: boolean;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

function toFormValues(category?: StashCategory): CategoryFormValues {
  return {
    nameSingular: category?.nameSingular ?? '',
    namePlural: category?.namePlural ?? '',
    defaultUnit: category?.defaultUnit ?? otherLikeCategoryDefaults.defaultUnit,
    showWeight: category?.showWeight ?? otherLikeCategoryDefaults.showWeight,
    showBrand: category?.showBrand ?? otherLikeCategoryDefaults.showBrand,
    showColor: category?.showColor ?? otherLikeCategoryDefaults.showColor,
    showSize: category?.showSize ?? otherLikeCategoryDefaults.showSize,
    showMaterial:
      category?.showMaterial ?? otherLikeCategoryDefaults.showMaterial,
    showUnit: category?.showUnit ?? otherLikeCategoryDefaults.showUnit,
    showNotes: category?.showNotes ?? otherLikeCategoryDefaults.showNotes,
    isConsumable:
      category?.isConsumable ?? otherLikeCategoryDefaults.isConsumable,
  };
}

function toInput(values: CategoryFormValues): StashCategoryInput {
  return {
    nameSingular: values.nameSingular.trim(),
    namePlural: values.namePlural.trim(),
    defaultUnit: values.defaultUnit.trim() || undefined,
    showWeight: values.showWeight,
    showBrand: values.showBrand,
    showColor: values.showColor,
    showSize: values.showSize,
    showMaterial: values.showMaterial,
    showUnit: values.showUnit,
    showNotes: values.showNotes,
    isConsumable: values.isConsumable,
  };
}

export default function Settings() {
  const {
    session,
    updateUserSettings,
    stashCategories,
    addStashCategory,
    updateStashCategory,
    archiveStashCategory,
  } = useAppData();
  const [editingCategory, setEditingCategory] = useState<StashCategory | null>(
    null,
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [categoryPendingArchive, setCategoryPendingArchive] =
    useState<StashCategory | null>(null);
  const [formValues, setFormValues] = useState<CategoryFormValues>(
    toFormValues(),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const activeCategories = stashCategories.filter(
    (category) => !category.archivedAt,
  );
  const archivedCategories = stashCategories.filter(
    (category) => category.archivedAt,
  );
  const isModalOpen = isAddOpen || Boolean(editingCategory);

  function openAddModal() {
    setFormValues(toFormValues());
    setSubmitError(null);
    setEditingCategory(null);
    setIsAddOpen(true);
  }

  function openEditModal(category: StashCategory) {
    setFormValues(toFormValues(category));
    setSubmitError(null);
    setIsAddOpen(false);
    setEditingCategory(category);
  }

  function closeModal() {
    setIsAddOpen(false);
    setEditingCategory(null);
    setSubmitError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!formValues.nameSingular.trim() || !formValues.namePlural.trim()) {
      setSubmitError('Singular and plural names are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await updateStashCategory(editingCategory.id, toInput(formValues));
      } else {
        await addStashCategory(toInput(formValues));
      }

      closeModal();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!categoryPendingArchive) {
      return;
    }

    setArchiveError(null);
    setIsArchiving(true);

    try {
      await archiveStashCategory(categoryPendingArchive.id);
      setCategoryPendingArchive(null);
    } catch (error) {
      setArchiveError(getErrorMessage(error));
    } finally {
      setIsArchiving(false);
    }
  }

  async function handleUserSettingChange(settings: UserSettings) {
    if (
      (settings.theme === undefined || session?.user.theme === settings.theme) &&
      (settings.colorTheme === undefined ||
        session?.user.colorTheme === settings.colorTheme)
    ) {
      return;
    }

    setSettingsError(null);
    setIsUpdatingSettings(true);

    try {
      await updateUserSettings(settings);
    } catch (error) {
      setSettingsError(getErrorMessage(error));
    } finally {
      setIsUpdatingSettings(false);
    }
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
            Settings
          </h1>
        </div>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/85 dark:shadow-[0_20px_60px_-35px_rgba(0,0,0,0.7)]">
          <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-100">
            User Settings
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SegmentedSetting
              label="Mode"
              value={session?.user.theme ?? 'dark'}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              disabled={isUpdatingSettings}
              onChange={(theme) => {
                void handleUserSettingChange({ theme });
              }}
            />
            <SegmentedSetting
              label="Accent Color"
              value={session?.user.colorTheme ?? 'rose'}
              options={[
                { value: 'rose', label: 'Rose' },
                { value: 'green', label: 'Green' },
              ]}
              disabled={isUpdatingSettings}
              onChange={(colorTheme) => {
                void handleUserSettingChange({ colorTheme });
              }}
            />
          </div>
          {settingsError ? (
            <p className="mt-4 text-sm text-rose-600 dark:text-rose-300">
              {settingsError}
            </p>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/85 dark:shadow-[0_20px_60px_-35px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-100">
                Stash Categories
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
                Shared with everyone in {session?.activeHousehold.name}. These
                categories appear in stash items, pattern requirements, and
                stash filters.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-accent-400 dark:text-stone-950 dark:hover:bg-accent-300"
            >
              <Plus size={18} />
              Category
            </button>
          </div>
          <div className="mt-6 grid gap-3">
            {activeCategories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onEdit={() => openEditModal(category)}
                onArchive={() => setCategoryPendingArchive(category)}
              />
            ))}
          </div>
        </section>

        {archivedCategories.length > 0 ? (
          <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/85 dark:shadow-[0_20px_60px_-35px_rgba(0,0,0,0.7)]">
            <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-100">
              Archived Categories
            </h2>
            <div className="mt-6 grid gap-3">
              {archivedCategories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  onEdit={() => openEditModal(category)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        isOpen={isModalOpen}
        onClose={closeModal}
        maxWidthClassName="max-w-3xl"
      >
        <CategoryForm
          values={formValues}
          onChange={setFormValues}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitError={submitError}
          submitLabel={editingCategory ? 'Save Changes' : 'Add Category'}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(categoryPendingArchive)}
        title="Archive Category"
        description={
          categoryPendingArchive
            ? `Archive "${categoryPendingArchive.nameSingular}"? Existing stash items and pattern requirements will keep this category.`
            : ''
        }
        confirmLabel="Archive Category"
        onConfirm={() => {
          void handleArchive();
        }}
        onCancel={() => {
          setCategoryPendingArchive(null);
          setArchiveError(null);
        }}
        error={archiveError}
        isConfirming={isArchiving}
      />
    </>
  );
}

function CategoryRow({
  category,
  onEdit,
  onArchive,
}: {
  category: StashCategory;
  onEdit: () => void;
  onArchive?: () => void;
}) {
  const flags = [
    category.showWeight ? 'Weight' : null,
    category.showBrand ? 'Brand' : null,
    category.showColor ? 'Color' : null,
    category.showSize ? 'Size' : null,
    category.showMaterial ? 'Material' : null,
    category.showUnit ? 'Unit' : null,
    category.showNotes ? 'Notes' : null,
    category.isConsumable ? 'Consumable' : 'Reference',
  ].filter(Boolean);

  return (
    <article className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-950/60">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              {category.nameSingular}
            </h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-inset ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700">
              {category.namePlural}
            </span>
            {category.isBuiltin ? (
              <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600 ring-1 ring-inset ring-accent-100 dark:bg-accent-950/30 dark:text-accent-200 dark:ring-accent-900/60">
                Built-in
              </span>
            ) : null}
            {category.archivedAt ? (
              <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                Archived
              </span>
            ) : null}
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Default unit: {category.defaultUnit ?? 'items'}
          </p>
          <div className="flex flex-wrap gap-2">
            {flags.map((flag) => (
              <span
                key={flag}
                className="rounded-full bg-white px-3 py-1 text-xs text-stone-600 ring-1 ring-inset ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={`Edit ${category.nameSingular}`}
            onClick={onEdit}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 transition hover:border-accent-200 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300 dark:hover:border-accent-400 dark:hover:text-stone-100"
          >
            <Pencil size={16} />
          </button>
          {!category.isBuiltin && !category.archivedAt && onArchive ? (
            <button
              type="button"
              aria-label={`Archive ${category.nameSingular}`}
              onClick={onArchive}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/80 dark:bg-stone-950 dark:text-rose-200 dark:hover:bg-rose-950/40"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SegmentedSetting<T extends Theme | ColorTheme>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </p>
      <div className="inline-flex rounded-2xl border border-stone-200 bg-white p-1 shadow-sm dark:border-stone-700 dark:bg-stone-950">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={[
                'min-w-24 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                isSelected
                  ? 'bg-accent-500 text-white shadow-sm dark:bg-accent-400 dark:text-stone-950'
                  : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100',
              ].join(' ')}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  submitError,
  submitLabel,
  isSubmitting,
}: {
  values: CategoryFormValues;
  onChange: (values: CategoryFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitError: string | null;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  function update<K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {submitError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
          {submitError}
        </div>
      ) : null}

      <FormSection title="Names">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Singular name">
            <TextInput
              value={values.nameSingular}
              onChange={(event) => update('nameSingular', event.target.value)}
              placeholder="Button"
            />
          </FormField>
          <FormField label="Plural name">
            <TextInput
              value={values.namePlural}
              onChange={(event) => update('namePlural', event.target.value)}
              placeholder="Buttons"
            />
          </FormField>
          <FormField label="Default unit">
            <TextInput
              value={values.defaultUnit}
              onChange={(event) => update('defaultUnit', event.target.value)}
              placeholder="items"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Behavior">
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckboxField
            label="Show weight"
            checked={values.showWeight}
            onChange={(checked) => update('showWeight', checked)}
          />
          <CheckboxField
            label="Show brand"
            checked={values.showBrand}
            onChange={(checked) => update('showBrand', checked)}
          />
          <CheckboxField
            label="Show color"
            checked={values.showColor}
            onChange={(checked) => update('showColor', checked)}
          />
          <CheckboxField
            label="Show size"
            checked={values.showSize}
            onChange={(checked) => update('showSize', checked)}
          />
          <CheckboxField
            label="Show material"
            checked={values.showMaterial}
            onChange={(checked) => update('showMaterial', checked)}
          />
          <CheckboxField
            label="Show unit"
            checked={values.showUnit}
            onChange={(checked) => update('showUnit', checked)}
          />
          <CheckboxField
            label="Show notes"
            checked={values.showNotes}
            onChange={(checked) => update('showNotes', checked)}
          />
          <CheckboxField
            label="Consumable"
            checked={values.isConsumable}
            onChange={(checked) => update('isConsumable', checked)}
          />
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

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-stone-300 text-accent-600 focus:ring-accent-300 dark:border-stone-600 dark:bg-stone-900 dark:focus:ring-accent-400"
      />
      {label}
    </label>
  );
}
