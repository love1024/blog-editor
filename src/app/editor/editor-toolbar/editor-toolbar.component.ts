import { NgClass } from '@angular/common';
import {
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import { Marks, Nodes } from '../editor-tiptap.model';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { Level } from '@tiptap/extension-heading';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [
    MatTooltipModule,
    MatDialogModule,
    NgClass,
    MatIconModule,
    FormsModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './editor-toolbar.component.html',
  styleUrl: './editor-toolbar.component.scss',
})
export class EditorToolbarComponent {
  editor = input.required<Editor | undefined>();
  disabled = input(false);
  disableFormatting = input(false);
  isSelection = input(false);
  isLink = input(false);
  linkUrl = input('');
  link = signal('');
  private dialogRef = signal<
    MatDialogRef<ElementRef<unknown>, string> | undefined
  >(undefined);
  private dialog = inject(MatDialog);
  private linkDialog = viewChild<TemplateRef<ElementRef>>('linkDialog');
  private fileUploader = viewChild<ElementRef>('fileUploader');

  constructor() {
    // Set the value of the link coming from the parent component
    // Untracked is used as otherwise we cannot update signal inside effect
    effect(() => {
      // something outside untracked is required like variable creation, otherwise it does not trigger the effect
      const url = this.linkUrl();
      untracked(() => {
        this.link.set(url);
      });
    });
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onDialogClick(): void {
    if (this.dialogRef) {
      this.dialogRef()?.close();
    }
  }

  addImage(): void {
    this.fileUploader()?.nativeElement.click();
  }

  openYoutubeDialog(): void {
    this.link.set(this.editor()?.getAttributes(Marks.LINK)['href']);
    const dialogRef = this.linkDialog();
    this.dialogRef.set(dialogRef && this.dialog.open(dialogRef));
    //https://www.youtube.com/watch?v=dZVjHCXvFWM
    this.dialogRef()
      ?.afterClosed()
      .pipe(finalize(() => this.dialogRef.set(undefined)))
      .subscribe(() => {
        // if cancelled
        if (this.link() === undefined) {
          return;
        }

        // if empty link is given
        if (this.link().trim() !== '') {
          this.editor()
            ?.chain()
            .focus()
            .setYoutubeVideo({
              src: this.link(),
            })
            .run();
        }
      });
  }

  openLinkDialog(): void {
    this.link.set(this.editor()?.getAttributes(Marks.LINK)['href']);
    const dialogRef = this.linkDialog();
    this.dialogRef.set(dialogRef && this.dialog.open(dialogRef));

    this.dialogRef()
      ?.afterClosed()
      .pipe(finalize(() => this.dialogRef.set(undefined)))
      .subscribe(() => {
        // if cancelled
        if (this.link() === undefined) {
          return;
        }

        // if empty link is given
        if (this.link().trim() === '') {
          this.editor()
            ?.chain()
            .focus()
            .extendMarkRange(Marks.LINK)
            .unsetLink()
            .run();
        } else {
          this.editor()
            ?.chain()
            .focus()
            .extendMarkRange(Marks.LINK)
            .setLink({ href: this.link() })
            .run();
        }
      });
  }

  uploadFile(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.editor()
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

  toggleBlockquote(): void {
    // If blockquote is already applied, we don't need to clear it, just toggle it
    if (this.editor()?.isActive(Nodes.BLOCKQUOTE)) {
      this.editor()?.chain().focus().toggleBlockquote().run();
    } else {
      this.editor()
        ?.chain()
        .focus()
        .clearNodes()
        .unsetAllMarks()
        .toggleBlockquote()
        .run();
    }
  }

  toggleHeading(level: Level): void {
    // If header is already applied, we don't need to clear it, just toggle it
    if (this.editor()?.isActive(Nodes.Heading, { level })) {
      this.editor()?.chain().focus().toggleHeading({ level }).run();
    } else {
      this.editor()
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

  toggleMark(mark: string): void {
    this.editor()?.chain().focus().toggleMark(mark).run();
  }

  toggleBulletList(): void {
    this.editor()?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor()?.chain().focus().toggleOrderedList().run();
  }

  toggleCodeblock(): void {
    this.editor()?.chain().focus().toggleCodeBlock().run();
  }

  toggleCode(): void {
    this.editor()?.chain().focus().toggleCode().run();
  }

  onLinkEdit(): void {
    this.openLinkDialog();
  }

  toggleLink(): void {
    if (this.editor()?.isActive(Marks.LINK)) {
      this.editor()?.chain().focus().unsetLink().run();

      // Check if after disabling, we need to show link menu or not
      // const { from, to } = this.editor()?.state?.selection || {
      //   from: 0,
      //   to: 0,
      // };
      // this.isSelection.set(from !== to);
    } else {
      this.openLinkDialog();
    }
  }
}
