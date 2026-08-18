import { fetchJson } from './fetchJson';

export type MediaUpload = {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return fetchJson<MediaUpload>('/api/media', {
    method: 'POST',
    body: formData,
  });
}

export function deleteMedia(mediaId: string) {
  return fetchJson<void>(`/api/media/${mediaId}`, { method: 'DELETE' }, true);
}
