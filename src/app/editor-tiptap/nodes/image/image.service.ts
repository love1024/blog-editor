import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, map, Observable } from 'rxjs';

export class UploadResponseDto {
  url: string;
  name: string;
  width: number;
  height: number;

  constructor(url: string, name: string, width: number, height: number) {
    this.url = url;
    this.name = name;
    this.width = width;
    this.height = height;
  }
}

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private readonly http = inject(HttpClient);

  uploadImage(file: File): Observable<UploadResponseDto> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<UploadResponseDto>('http://localhost:3000/upload', formData)
      .pipe(catchError(() => EMPTY));
  }
}
