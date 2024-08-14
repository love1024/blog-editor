import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'editor',
    loadComponent: () =>
      import('./editor/editor-tiptap.component').then(
        mod => mod.EditorTiptapComponent
      ),
  },
  {
    path: 'viewer',
    loadComponent: () =>
      import('./viewer/viewer.component').then(mod => mod.ViewerComponent),
  },
  {
    path: '**',
    redirectTo: 'editor',
  },
];
