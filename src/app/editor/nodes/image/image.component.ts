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
  OnDestroy,
  ChangeDetectorRef,
  AfterViewInit,
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
import { IMAGE_SCREEN_BREAKPOINTS } from '@core/application/const';
import { imageTooltipConfig } from './image.config';
import { EditorEvents, Nodes } from '../../editor-tiptap.model';

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
export class ImageComponent
  extends AngularNodeViewComponent
  implements OnInit, AfterViewInit, OnDestroy
{
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
  private dialogRef?: MatDialogRef<ElementRef<unknown>, string>;
  private tippyRef = signal<TippyInstance<unknown> | undefined>(undefined);
  private readonly dialog = inject(MatDialog);
  private readonly imageService = inject(ImageService);
  private readonly cd = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.editable.set(this.editor.isEditable);
    if (this.editable()) {
      this.listenToEditorEvents();
    }

    const isImageNew = this.node.attrs['isNew'] as boolean;
    if (isImageNew) {
      this.uploadAndRenderImage();
    } else {
      this.renderImage();
    }
  }

  ngAfterViewInit(): void {
    if (this.editable()) {
      this.initializeTooltip();
    } else {
      mediumZoom(this.img()?.nativeElement);
    }
  }

  /**
   * Stop listening to all events if the image is deleted
   */
  ngOnDestroy(): void {
    this.editor.off(
      EditorEvents.SELECTION_UPDATE,
      this.onEditorSelectionUpdate
    );
    this.editor.off(EditorEvents.UPDATE, this.onEditorUpdate);
  }

  onImageLoaded(): void {
    // Wait for editor to focus on the image
    setTimeout(() => this.checkIfNeedToShowTooltip(), 100);
  }

  /**
   * On image click, focus on the current node
   */
  onImageClick(): void {
    this.editor.$doc.children.forEach(node => {
      if (node.node === this.node) {
        this.editor.commands.focus(node.to - 1);
        setTimeout(() => this.tippyRef()?.show());
      }
    });
  }

  /**
   * Open Alternate text dialog
   */
  openAltTextDialog(): void {
    this.tippyRef()?.hide();
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
          this.editor.commands.updateAttributes(Nodes.Image, {
            alt: this.altText,
          });
        }
      });
  }

  /**
   * Deletes the current image node from the editor by converting it
   * to a paragraph. This way, it will keep the space.
   */
  deleteImage(): void {
    this.imageService.deleteCurrentImage(this.editor);
  }

  /**
   * Close the dialog on Enter press.
   */
  @HostListener('window:keyup.Enter', ['$event'])
  private onEnterClick(): void {
    if (this.dialogRef) {
      this.dialogRef?.close();
    }
  }

  private uploadAndRenderImage(): void {
    this.toBase64(this.node.attrs['src']).subscribe(base64 => {
      this.src.set(base64);
      this.altText.set(this.node.attrs['alt']);
      this.updateAttributes({ src: base64, isNew: false });
    });

    this.imageService.uploadImage(this.node.attrs['src']).subscribe(res => {
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
  }

  private renderImage(): void {
    if (
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
      // This is only temporarily for local development
      // if the upload server is not working, then we store image
      // as base64 string
      this.src.set(this.node.attrs['src']);
      this.altText.set(this.node.attrs['alt']);
    }
  }

  private initializeTooltip(): void {
    const target = this.img()?.nativeElement;
    const content = this.imageTooltip()?.nativeElement.content;
    if (target && content) {
      const ref = tippy(target, {
        content: content,
        ...imageTooltipConfig,
      });
      this.tippyRef.set(ref);
    }
  }

  /**
   * Checks if the tooltip needs to be shown for the image component.
   */
  private checkIfNeedToShowTooltip(): void {
    const { from, to } = this.editor.state.selection;
    let anyImageFound = false;

    // if the current selection is inside the image node
    this.editor.state.doc.nodesBetween(from, to, node => {
      if (node.type.name === Nodes.Image && node === this.node) {
        // Only show tooltip if it was not in focus before
        if (!this.inFocus()) {
          this.tippyRef()?.show();
        }

        this.inFocus.set(true);
        anyImageFound = true;
      }
    });

    this.cd.markForCheck();
    // If not found, hide the tooltip
    if (!anyImageFound) {
      this.inFocus.set(false);
      this.tippyRef()?.hide();
    }
  }

  /**
   * Converts a File object to a base64 string.
   * @param file - The File object to be converted.
   * @returns An Observable that emits the base64 string.
   */
  private toBase64(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      reader.onerror = observer.error;
    });
  }

  /**
   * Generates the srcset attribute value for an image based on the given width.
   *
   * @param width - The width of the image.
   * @returns The srcset attribute value as a string.
   */
  private generateSrcset(width: number): string {
    // Filter to only include sizes up to the intrinsic width of the image
    return IMAGE_SCREEN_BREAKPOINTS.filter(size => size <= width)
      .map(size => `${size}w`)
      .join(', ');
  }

  private listenToEditorEvents(): void {
    this.editor.on(EditorEvents.SELECTION_UPDATE, this.onEditorSelectionUpdate);
    this.editor.on(EditorEvents.UPDATE, this.onEditorUpdate);
  }

  private onEditorSelectionUpdate = (): void => {
    this.checkIfNeedToShowTooltip();
  };

  private onEditorUpdate = (): void => {
    this.tippyRef()?.hide();
  };
}
