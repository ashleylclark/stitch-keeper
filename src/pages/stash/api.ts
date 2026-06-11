import type { StashCategory, StashItem } from '../../types/models';
import { fetchJson } from '../../shared/api/fetchJson';

export type StashCategoryInput = Pick<
  StashCategory,
  | 'nameSingular'
  | 'namePlural'
  | 'showWeight'
  | 'showBrand'
  | 'showColor'
  | 'showSize'
  | 'showMaterial'
  | 'showUnit'
  | 'showNotes'
  | 'isConsumable'
> &
  Partial<Pick<StashCategory, 'defaultUnit' | 'archivedAt'>>;

export function fetchStashCategories() {
  return fetchJson<StashCategory[]>('/api/stash-categories');
}

export function createStashCategory(category: StashCategoryInput) {
  return fetchJson<StashCategory>('/api/stash-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  });
}

export function saveStashCategory(
  categoryId: string,
  category: StashCategoryInput,
) {
  return fetchJson<StashCategory>(`/api/stash-categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  });
}

export function archiveStashCategory(categoryId: string) {
  return fetchJson<StashCategory>(`/api/stash-categories/${categoryId}`, {
    method: 'DELETE',
  });
}

export function fetchStashItems() {
  return fetchJson<StashItem[]>('/api/stash');
}

export function createStashItem(item: StashItem) {
  return fetchJson<StashItem>('/api/stash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
}

export function saveStashItem(item: StashItem) {
  return fetchJson<StashItem>(`/api/stash/${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
}

export function removeStashItem(itemId: string) {
  return fetchJson<void>(`/api/stash/${itemId}`, { method: 'DELETE' }, true);
}
