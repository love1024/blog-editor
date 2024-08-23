import { Component, Injector, OnInit, inject, signal } from '@angular/core';
import { Editor } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Link from '@tiptap/extension-link';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Youtube from '@tiptap/extension-youtube';
import History from '@tiptap/extension-history';
import { Heading } from '@tiptap/extension-heading';
import { EditorTitleComponent } from './editor-title/editor-title.component';
import { getExtendedExtension } from './extend-extensions';
import { Mark, Node } from '@tiptap/pm/model';
import { Marks, Nodes } from './editor-tiptap.model';
import { TrailingNode } from './extensions/trailing-node';
import { ImageExtension } from './nodes/image/extension';
import { EditorToolbarComponent } from './editor-toolbar/editor-toolbar.component';

@Component({
  selector: 'app-editor-tiptap',
  standalone: true,
  imports: [EditorTitleComponent, EditorToolbarComponent],
  templateUrl: './editor-tiptap.component.html',
  styleUrl: './editor-tiptap.component.scss',
})
export class EditorTiptapComponent implements OnInit {
  editor?: Editor;
  disableFormatting = signal(false); // Disable formatting for headings
  disabled = signal(false);
  isSelection = signal(false); // Whether any text is selected by the user or not
  isLink = signal(false);
  linkUrl = signal('');
  private readonly injector = inject(Injector);

  ngOnInit(): void {
    const content = localStorage.getItem('DATA');

    this.editor = new Editor({
      element: document.querySelector('#editor') ?? undefined,
      extensions: [
        Document,
        Paragraph,
        BulletList,
        OrderedList,
        Text,
        TrailingNode,
        History,
        Placeholder.configure({
          placeholder: 'Enter Your Story Here...',
        }),
        Heading.extend({ marks: '' }).configure({
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
            class: 'mx-auto readonly-video',
          },
        }),
        BubbleMenu.configure({
          pluginKey: 'linkBubble',
          element: document.querySelector('#linkBubble') as HTMLElement,
          shouldShow: ({ state, from, to }) => {
            // Show link popup if it contains link mark in a selection or
            // the current cursor point
            const fromNode = state.doc.nodeAt(from);
            const toNode = state.doc.nodeAt(to);
            if (fromNode || toNode) {
              const linkMark =
                this.getLinkMark(fromNode) || this.getLinkMark(toNode);
              if (linkMark) {
                this.linkUrl.set(linkMark?.attrs['href'] || '');
                return true;
              }
            }
            return false;
          },
        }),
        ImageExtension(this.injector),
        ...getExtendedExtension(),
      ],
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        const node = editor.state.doc.nodeAt(from);
        if (node) {
          // Check if link mark exists
          const link = node.marks.filter(mark => mark.type.name === Marks.LINK);
          if (link.length > 0) {
            this.isLink.set(true);
          } else {
            this.isLink.set(false);
          }
        }

        this.isSelection.set(from !== to);
        this.disableFormatting.set(editor.isActive(Nodes.Heading));

        // Update scroll position
        const coords = editor.view.coordsAtPos(editor.state.selection.from);

        const scrollTop = window.scrollY;
        // Calculate the coordinates relative to the scroll container
        const y = coords.top + scrollTop;
        if (y < 250) {
          window.scrollTo(coords.left, 0);
        } else if (coords.top < 100) {
          window.scrollTo(coords.left, y - 100);
        }
      },
      onFocus: ({ editor }) => {
        this.disabled.set(false);
        this.disableFormatting.set(editor.isActive(Nodes.Heading));
      },
      onUpdate: ({ editor }) => {
        this.disableFormatting.set(editor.isActive(Nodes.Heading));

        localStorage.setItem('DATA', JSON.stringify(editor.getJSON()));
      },
      content: JSON.parse(content || ''),
    });
  }

  /**
   * Get link mark out of the node
   * @param node
   * @returns
   */
  private getLinkMark(node: Node | null): Mark | null {
    if (node === null) {
      return null;
    }
    const linkMark = node.marks.filter(mark => mark.type.name === Marks.LINK);
    return linkMark.length > 0 ? linkMark[0] : null;
  }
}
