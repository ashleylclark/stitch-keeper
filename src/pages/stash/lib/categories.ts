import type { ItemCategory, StashCategory } from '../../../types/models';

export const otherLikeCategoryDefaults = {
  defaultUnit: 'items',
  showWeight: false,
  showBrand: true,
  showColor: true,
  showSize: true,
  showMaterial: true,
  showUnit: true,
  showNotes: true,
  isConsumable: true,
};

export function getCategoryLabel(
  categoryId: ItemCategory,
  categories: StashCategory[],
  form: 'singular' | 'plural' = 'singular',
) {
  const category = categories.find((candidate) => candidate.id === categoryId);

  if (category) {
    return form === 'plural' ? category.namePlural : category.nameSingular;
  }

  return titleCase(categoryId);
}

export function getCategory(
  categoryId: ItemCategory,
  categories: StashCategory[],
) {
  return categories.find((category) => category.id === categoryId);
}

export function getActiveCategories(
  categories: StashCategory[],
  selectedCategory?: ItemCategory,
) {
  return categories.filter(
    (category) => !category.archivedAt || category.id === selectedCategory,
  );
}

export function getDefaultUnit(category?: StashCategory) {
  return category?.defaultUnit ?? 'items';
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
