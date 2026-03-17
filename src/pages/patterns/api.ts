import type { Pattern } from '../../types/models';
import { fetchJson } from '../../shared/api/fetchJson';

export function fetchPatterns() {
  return fetchJson<Pattern[]>('/api/patterns');
}

export function createPattern(pattern: Pattern) {
  return fetchJson<Pattern>('/api/patterns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pattern),
  });
}

export function savePattern(pattern: Pattern) {
  return fetchJson<Pattern>(`/api/patterns/${pattern.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pattern),
  });
}

export function removePattern(patternId: string) {
  return fetchJson<void>(
    `/api/patterns/${patternId}`,
    { method: 'DELETE' },
    true,
  );
}
