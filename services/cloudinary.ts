import { Platform } from 'react-native';
import { API_BASE_URL } from './config';
import { apiErrors } from './apiErrors';
import { ApiError } from './api';
import type { DreamImage } from '@/lib/docs/types/dream';

export type CloudinaryContext = 'dreams' | 'characters' | 'locations' | 'objects';

function extToMime(ext: string): string {
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    default: return 'image/jpeg';
  }
}

/**
 * Sube una imagen al backend (que la reenvía a Cloudinary).
 * Funciona tanto en nativo (file:// URI) como en web (blob: URI).
 */
export async function uploadImage(
  fileUri: string,
  context: CloudinaryContext = 'dreams',
): Promise<DreamImage> {
  const name = fileUri.split('/').pop()?.split('?')[0] ?? 'photo.jpg';
  const ext = name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = extToMime(ext);

  const form = new FormData();

  if (Platform.OS === 'web') {
    const blobRes = await fetch(fileUri);
    const blob = await blobRes.blob();
    form.append('file', blob, name.includes('.') ? name : `photo.${ext}`);
  } else {
    form.append('file', { uri: fileUri, name, type: mime } as any);
  }

  const url = `${API_BASE_URL}/cloudinary/upload?context=${context}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: form,
    });
  } catch {
    apiErrors.emit('No se pudo subir la imagen. Revisa tu conexión.');
    throw new ApiError(0, 'Network error');
  }

  if (!res.ok) {
    let parsed: unknown;
    try { parsed = await res.json(); } catch { parsed = await res.text(); }
    const msg = res.status === 400
      ? 'Imagen no válida (solo JPEG, PNG, WebP, GIF; máx 10 MB).'
      : `Error al subir imagen (${res.status}).`;
    apiErrors.emit(msg);
    throw new ApiError(res.status, parsed);
  }

  const data = (await res.json()) as { publicId: string; secureUrl: string };
  return { publicId: data.publicId, secureUrl: data.secureUrl };
}

export const cloudinaryService = { uploadImage };
