import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
  viewChild,
} from '@angular/core';
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
import { Heading, Level } from '@tiptap/extension-heading';
import { EditorTitleComponent } from './editor-title/editor-title.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NgClass } from '@angular/common';
import { getExtendedExtension } from './extend-extensions';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Mark, Node } from '@tiptap/pm/model';
import { Marks, Nodes } from './editor-tiptap.model';
import { TrailingNode } from './extensions/trailing-node';
import { ImageExtension } from './nodes/image/extension';

@Component({
  selector: 'app-editor-tiptap',
  standalone: true,
  imports: [
    EditorTitleComponent,
    MatIconModule,
    MatTooltipModule,
    NgClass,
    FormsModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './editor-tiptap.component.html',
  styleUrl: './editor-tiptap.component.scss',
})
export class EditorTiptapComponent implements OnInit {
  editor?: Editor;
  disableFormatting = false; // Disable formatting for headings
  disabled = false;
  isSelection = false; // Whether any text is selected by the user or not
  link = '';
  @ViewChild('linkDialog') linkDialog!: TemplateRef<ElementRef>;
  fileUploader = viewChild<ElementRef>('fileUploader');
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  private dialogRef?: MatDialogRef<ElementRef<unknown>, string>;

  @HostListener('window:keyup.Enter', ['$event'])
  onDialogClick(): void {
    if (this.dialogRef) {
      this.dialogRef?.close();
    }
  }

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
            class: 'mx-auto',
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
                this.link = linkMark?.attrs['href'] || '';
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
          // Show the selection even if no text is selected
          // but the link is already there
          const link = node.marks.filter(mark => mark.type.name === Marks.LINK);
          if (link.length > 0) {
            this.isSelection = true;
            return;
          }
        }
        this.isSelection = from !== to;
        this.disableFormatting = editor.isActive(Nodes.Heading);

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
        this.disabled = false;
        this.disableFormatting = editor.isActive(Nodes.Heading);
      },
      onUpdate: ({ editor }) => {
        this.disableFormatting = editor.isActive(Nodes.Heading);

        localStorage.setItem('DATA', JSON.stringify(editor.getJSON()));
      },
      content: JSON.parse(content || ''),
    });
  }

  onLinkEdit(): void {
    this.openLinkDialog();
  }

  toggleLink(): void {
    if (this.editor?.isActive(Marks.LINK)) {
      this.editor?.chain().focus().unsetLink().run();

      // Check if after disabling, we need to show link menu or not
      const { from, to } = this.editor?.state?.selection || { from: 0, to: 0 };
      this.isSelection = from !== to;
    } else {
      this.openLinkDialog();
    }
  }

  openLinkDialog(): void {
    this.link = this.editor?.getAttributes(Marks.LINK)['href'];

    this.dialogRef = this.dialog.open(this.linkDialog);

    this.dialogRef
      .afterClosed()
      .pipe(finalize(() => (this.dialogRef = undefined)))
      .subscribe(() => {
        // if cancelled
        if (this.link === undefined) {
          return;
        }

        // if empty link is given
        if (this.link.trim() === '') {
          this.editor
            ?.chain()
            .focus()
            .extendMarkRange(Marks.LINK)
            .unsetLink()
            .run();
        } else {
          this.editor
            ?.chain()
            .focus()
            .extendMarkRange(Marks.LINK)
            .setLink({ href: this.link })
            .run();
        }
      });
  }

  openYoutubeDialog(): void {
    this.link = this.editor?.getAttributes(Marks.LINK)['href'];

    this.dialogRef = this.dialog.open(this.linkDialog);
    //https://www.youtube.com/watch?v=dZVjHCXvFWM
    this.dialogRef
      .afterClosed()
      .pipe(finalize(() => (this.dialogRef = undefined)))
      .subscribe(() => {
        // if cancelled
        if (this.link === undefined) {
          return;
        }

        // if empty link is given
        if (this.link.trim() !== '') {
          this.editor
            ?.chain()
            .focus()
            .setYoutubeVideo({
              src: this.link,
            })
            .run();
        }
      });
  }

  addImage(): void {
    this.fileUploader()?.nativeElement.click();
  }

  uploadFile(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.editor
        ?.chain()
        .focus()
        .setImage({
          src: fileList[0],
          isNew: true, // To indicate that the image is newly uploaded
        })
        .run();
    }
  }

  onFileUploadClick(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    element.value = '';
  }

  toggleMark(mark: string): void {
    this.editor?.chain().focus().toggleMark(mark).run();
  }

  toggleHeading(level: Level): void {
    // If header is already applied, we don't need to clear it, just toggle it
    if (this.editor?.isActive(Nodes.Heading, { level })) {
      this.editor?.chain().focus().toggleHeading({ level }).run();
    } else {
      this.editor
        ?.chain()
        .focus()
        .clearNodes()
        .unsetMark(Marks.BOLD)
        .unsetMark(Marks.ITALIC)
        .unsetMark(Marks.STRIKE)
        .toggleHeading({ level })
        .run();
    }
  }

  toggleBlockquote(): void {
    // If blockquote is already applied, we don't need to clear it, just toggle it
    if (this.editor?.isActive(Nodes.BLOCKQUOTE)) {
      this.editor?.chain().focus().toggleBlockquote().run();
    } else {
      this.editor
        ?.chain()
        .focus()
        .clearNodes()
        .unsetAllMarks()
        .toggleBlockquote()
        .run();
    }
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  toggleCodeblock(): void {
    this.editor?.chain().focus().toggleCodeBlock().run();
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
