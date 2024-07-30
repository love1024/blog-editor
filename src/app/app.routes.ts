import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'editor',
    loadComponent: () =>
      import('./editor/editor.component').then((mod) => mod.EditorComponent),
  },
  {
    path: 'tiptap',
    loadComponent: () =>
      import('./editor-tiptap/editor-tiptap.component').then(
        (mod) => mod.EditorTiptapComponent
      ),
  },
  {
    path: 'viewer',
    loadComponent: () =>
      import('./viewer/viewer.component').then((mod) => mod.ViewerComponent),
  },
];
