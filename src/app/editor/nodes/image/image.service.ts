import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AppEvent, AppEventService } from '@core/services';
import { Editor } from '@tiptap/core';
import { catchError, EMPTY, Observable } from 'rxjs';

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
  private readonly appEventService = inject(AppEventService);

  uploadImage(file: File): Observable<UploadResponseDto> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<UploadResponseDto>('http://localhost:3000/upload', formData)
      .pipe(catchError(() => EMPTY));
  }

  listenToAppEvents(): Observable<AppEvent> {
    return this.appEventService.listenToAppEvents();
  }

  /**
   * Deletes the currently selected image in the editor.
   *
   * @param editor - The editor instance.
   * @returns void
   */
  deleteCurrentImage(editor: Editor): void {
    const { state, view } = editor;
    const { selection } = state;
    const { tr } = state;

    // Clear the figcaption content first
    tr.deleteRange(
      editor.$pos(selection.from).from,
      editor.$pos(selection.from).to - 1
    );
    view.dispatch(tr);

    // Wait fro the deletion to be completed and then set the paragraph
    // We need to set the paragraph to keep the empty space when image is deleted
    setTimeout(() => editor.commands.setParagraph());
  }
}
