import { Component, Injector, inject } from '@angular/core';
import { Editor } from '@tiptap/core';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import { TrailingNode } from '../editor-tiptap/extensions/trailing-node';
import Text from '@tiptap/extension-text';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { ImageExtension } from '../editor-tiptap/nodes/image/extension';
import { getCustomExtension } from '../editor-tiptap/custom-extensions';
import { EditorTitleComponent } from '../editor/editor-title/editor-title.component';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [EditorTitleComponent],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss',
})
export class ViewerComponent {
  editor?: Editor;
  private readonly injector = inject(Injector);

  ngOnInit(): void {
    const content = localStorage.getItem('DATA');
    if (!content) {
      return;
    }
    this.editor = new Editor({
      element: document.querySelector('#editor') ?? undefined,
      editable: false,
      content: JSON.parse(content),
      extensions: [
        Document,
        Paragraph,
        BulletList,
        OrderedList,
        Text,
        TrailingNode,
        Heading.configure({
          levels: [2, 3],
        }),
        Link.extend({ inclusive: false }).configure({
          // Inclusive is needed to add normal text after the link and continuing the link
          openOnClick: false,
          autolink: true,
        }),
        Youtube.configure({
          nocookie: true,
          HTMLAttributes: {
            class: 'mx-auto',
          },
        }),
        ImageExtension(this.injector),
        ...getCustomExtension(this.injector),
      ],
    });
  }
}
