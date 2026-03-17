import type { StashItem } from '../../types/models';
import { fetchJson } from '../../shared/api/fetchJson';

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
