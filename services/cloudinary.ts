import type { ImagePickerAsset } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { ApiError, postFormData } from './api';
import { API_BASE_URL } from './config';

export type CloudinaryUploadResult = {
  publicId: string;
  secureUrl: string;
};

function extForMime(mime: string | undefined): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

/**
 * `fetch` + `FormData` en React Native a veces no envía bien el multipart a Multer.
 * Copiamos a un `file://` local y usamos `uploadAsync` nativo (multipart RFC 2387).
 */
async function ensureLocalFileUri(asset: ImagePickerAsset): Promise<string> {
  const uri = asset.uri;
  if (uri.startsWith('file://')) {
    return uri;
  }
  const cache = FileSystem.cacheDirectory;
  if (!cache) {
    throw new Error('No hay directorio de caché para preparar la imagen.');
  }
  const ext = extForMime(asset.mimeType);
  const dest = `${cache}dream-upload-${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

async function uploadViaFormDataWeb(asset: ImagePickerAsset): Promise<string> {
  const res = await fetch(asset.uri);
  const blob = await res.blob();
  const formData = new FormData();
  formData.append('file', blob, asset.fileName ?? 'dream.jpg');
  const raw = await postFormData<CloudinaryUploadResult>(
    '/cloudinary/upload?context=dreams',
    formData,
  );
  return raw.secureUrl;
}

/**
 * Sube una imagen al backend (`POST /cloudinary/upload?context=dreams`), que la reenvía a Cloudinary.
 * Devuelve la URL segura para guardar en `dreamImages[]`.
 */
export async function uploadDreamImageToCloudinary(
  asset: ImagePickerAsset,
): Promise<string> {
  const mime = asset.mimeType ?? 'image/jpeg';

  if (Platform.OS === 'web') {
    return uploadViaFormDataWeb(asset);
  }

  const localUri = await ensureLocalFileUri(asset);
  const base = API_BASE_URL.replace(/\/+$/, '');
  const url = `${base}/cloudinary/upload?context=dreams`;

  const result = await FileSystem.uploadAsync(url, localUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: mime,
  });

  if (result.status < 200 || result.status >= 300) {
    let parsed: unknown = result.body;
    try {
      parsed = JSON.parse(result.body);
    } catch {
      /* cuerpo no JSON */
    }
    throw new ApiError(result.status, parsed);
  }

  let data: CloudinaryUploadResult;
  try {
    data = JSON.parse(result.body) as CloudinaryUploadResult;
  } catch {
    throw new Error('Respuesta de subida inválida.');
  }
  return data.secureUrl;
}
