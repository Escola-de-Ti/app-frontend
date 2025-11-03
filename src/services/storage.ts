import { api } from '../api/client';
import type { Imagem } from '../types';

export async function uploadImages(
  files: { uri: string; name?: string; type?: string }[]
): Promise<Imagem[]> {
  const form = new FormData();
  files.forEach((f, idx) => {
    const name = f.name || `image_${idx}.jpg`;
    const type = f.type || 'image/jpeg';
    // @ts-expect-error RN FormData
    form.append('files', { uri: f.uri, name, type });
  });

  const { data } = await api.post('/storage/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return Array.isArray(data) ? data : [data];
}

export async function deleteImage(id: string): Promise<void> {
  await api.delete(`/storage/delete/${id}`);
}
