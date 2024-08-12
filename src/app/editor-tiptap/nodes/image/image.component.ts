import {
  NgClass,
  NgIf,
  NgOptimizedImage,
  provideImageKitLoader,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  TemplateRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AngularNodeViewComponent, NgxTiptapModule } from 'ngx-tiptap';
import { finalize, Observable } from 'rxjs';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import mediumZoom from 'medium-zoom';
import { ImageService } from './image.service';

@Component({
  selector: 'app-image',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgIf,
    NgClass,
    NgxTiptapModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [provideImageKitLoader('https://ik.imagekit.io/readolio')],
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent extends AngularNodeViewComponent implements OnInit {
  src = signal('');
  isUploaded = signal(false);
  inFocus = signal(false);
  inHover = signal(false);
  altText = signal('');
  editable = signal(true);
  imgWidth = signal(0);
  imgHeight = signal(0);
  srcset = signal('');
  img = viewChild<ElementRef<HTMLImageElement>>('imgRef');
  imageTooltip = viewChild<ElementRef<HTMLTemplateElement>>('imageTooltip');
  altTextDialog = viewChild<TemplateRef<ElementRef>>('altTextDialog');
  private readonly dialog = inject(MatDialog);
  private dialogRef?: MatDialogRef<ElementRef<unknown>, string>;
  private tippyRef?: TippyInstance<unknown>;
  private readonly imageService = inject(ImageService);

  ngOnInit(): void {
    if (this.node.attrs['src'] instanceof File) {
      this.toBase64(this.node.attrs['src']).subscribe((base64) => {
        this.src.set(base64);
        this.altText.set(this.node.attrs['alt']);
        this.updateAttributes({ src: base64 });
      });

      this.imageService.uploadImage(this.node.attrs['src']).subscribe((res) => {
        this.updateAttributes({
          src: res.name,
          width: res.width,
          height: res.height,
        });
        this.src.set(res.name);
        this.imgWidth.set(res.width);
        this.imgHeight.set(res.height);
        this.isUploaded.set(true);
        this.srcset.set(this.generateSrcset(res.width));
      });
    } else if (
      this.node.attrs['src'].endsWith('jpeg') ||
      this.node.attrs['src'].endsWith('jpg')
    ) {
      this.src.set(this.node.attrs['src']);
      this.altText.set(this.node.attrs['alt']);
      this.imgWidth.set(this.node.attrs['width']);
      this.imgHeight.set(this.node.attrs['height']);
      this.isUploaded.set(true);
      this.srcset.set(this.generateSrcset(this.imgWidth()));
    } else {
      this.src.set(this.node.attrs['src']);
      this.altText.set(this.node.attrs['alt']);
    }
    this.editable.set(this.editor.isEditable);
    if (this.editable()) {
      this.subscribeToSelectionUpdate();
      this.editor.on('update', () => {
        this.tippyRef?.hide();
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.editable()) {
      setTimeout(() => {
        const target = this.img()?.nativeElement;
        const content = this.imageTooltip()?.nativeElement.content;
        if (target && content) {
          this.tippyRef = tippy(target, {
            content: content,
            placement: 'right',
            interactive: true,
            allowHTML: true,
            trigger: 'click',
          });
          this.inFocus() && this.tippyRef?.show();
        }
      }, 0);
    } else {
      mediumZoom(this.img()?.nativeElement);
    }
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onDialogClick(): void {
    if (this.dialogRef) {
      this.dialogRef?.close();
    }
  }

  openAltTextDialog(): void {
    this.tippyRef?.hide();
    const dialog = this.altTextDialog();
    this.dialogRef =
      dialog &&
      this.dialog.open(dialog, {
        width: '500px',
      });
    this.dialogRef
      ?.afterClosed()
      .pipe(finalize(() => (this.dialogRef = undefined)))
      .subscribe(() => {
        // if cancelled
        if (this.altText === undefined) {
          return;
        }

        if (this.altText().trim() !== '') {
          this.editor.commands.updateAttributes('imageComponent', {
            alt: this.altText,
          });
        }
      });
  }

  deleteImage(): void {
    this.editor.commands.deleteNode('imageComponent');
  }

  subscribeToSelectionUpdate(): void {
    this.editor.on('selectionUpdate', () => {
      const { from, to } = this.editor.state.selection;
      // We only want to highlight the current image node, so node === this.node
      let anyImageFound = false;
      this.editor.state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'imageComponent' && node === this.node) {
          // Only show tooltip if it was not in focus before
          if (!this.inFocus()) {
            this.tippyRef?.show();
          }
          this.inFocus.set(true);
          anyImageFound = true;
        }
      });
      if (!anyImageFound) {
        this.inFocus.set(false);
        this.tippyRef?.hide();
      }
    });
  }

  toBase64(file: File): Observable<string> {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      reader.onerror = observer.error;
    });
  }

  generateSrcset(width: number): string {
    const sizes = [320, 480, 640, 768, 1024, 1280, 1600, 1920, 2560];
    return sizes
      .filter((size) => size <= width) // Filter to only include sizes up to the intrinsic width
      .map((size) => `${size}w`)
      .join(', ');
  }
}
