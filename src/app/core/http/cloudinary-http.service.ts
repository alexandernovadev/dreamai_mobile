import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Matches dreamia_back/src/cloudinary/cloudinary-folders.ts UPLOAD_CONTEXT —
// only entities with an `imageUri` field have a context (events/feelings/
// life-context don't).
export type CloudinaryUploadContext =
  | 'dreams'
  | 'characters'
  | 'locations'
  | 'objects';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
}

@Injectable({ providedIn: 'root' })
export class CloudinaryHttpService {
  private readonly http = inject(HttpClient);

  upload(
    file: File,
    context: CloudinaryUploadContext = 'dreams',
  ): Observable<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CloudinaryUploadResult>(
      `${environment.apiBaseUrl}/cloudinary/upload`,
      formData,
      { params: { context } },
    );
  }
}
