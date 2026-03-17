import type { Project } from '../../types/models';
import { fetchJson } from '../../shared/api/fetchJson';

export function fetchProjects() {
  return fetchJson<Project[]>('/api/projects');
}

export function createProject(project: Project) {
  return fetchJson<Project>('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
}

export function saveProject(project: Project) {
  return fetchJson<Project>(`/api/projects/${project.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
}

export function removeProject(projectId: string) {
  return fetchJson<void>(
    `/api/projects/${projectId}`,
    { method: 'DELETE' },
    true,
  );
}
