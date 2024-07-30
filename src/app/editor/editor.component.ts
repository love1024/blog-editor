import { Component } from '@angular/core';
import {
  EditorChangeContent,
  EditorChangeSelection,
  QuillModule,
  SelectionChange,
} from 'ngx-quill';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import Quill from 'quill';
import { NgClass } from '@angular/common';
import { formats } from './editor.model';
import { EditorTitleComponent } from './editor-title/editor-title.component';
import { Context } from 'quill/modules/keyboard';
import Toolbar from 'quill/modules/toolbar';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    QuillModule,
    FormsModule,
    MatIconModule,
    NgClass,
    EditorTitleComponent,
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent {
  disableFormatting = false; // Disable formatting for headings
  disabled = true;
  formats = formats; // Allowed formats
  quill!: Quill;
  content = [];
  modules = this.getCustomModules();

  onEditorCreated(quill: Quill): void {
    this.quill = quill;

    quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
      delta.forEach((e: any) => {
        if (e.attributes) {
          if (e.attributes.header === 1) {
            e.attributes.header = 2;
          } else if (e.attributes.header > 3) {
            e.attributes.header = null;
          }
        }
      });
      return delta;
    });

    const toolbar = quill.getModule('toolbar') as Toolbar;
    toolbar.addHandler('bold', (value: any) => {
      if (this.isHeaderElement()) {
        return;
      }
      this.quill.format('bold', value, Quill.sources.USER);
    });
    toolbar.addHandler('italic', (value: any) => {
      if (this.isHeaderElement()) {
        return;
      }
      this.quill.format('italic', value, Quill.sources.USER);
    });
    toolbar.addHandler('underline', (value: any) => {
      if (this.isHeaderElement()) {
        return;
      }
      this.quill.format('underline', value, Quill.sources.USER);
    });
    toolbar.addHandler('header', (value: any) => {
      const selection = this.quill.getSelection();
      this.quill.removeFormat(selection?.index || 0, selection?.length || 0);
      this.quill.format('header', value, Quill.sources.USER);
    });
  }

  onUpdate(e: EditorChangeContent | EditorChangeSelection): void {
    switch (e.event) {
      case 'selection-change':
        break;
      case 'text-change':
        console.log(e.content);
        break;
    }
    if ((e as EditorChangeSelection).range === null) {
      this.disabled = true;
    } else {
      this.disabled = false;
      this.disableFormattingForHeader();
    }
  }

  /**
   * Formatting is not allowed for header elements
   * @param editor
   */
  disableFormattingForHeader(): void {
    if (this.isHeaderElement()) {
      this.disableFormatting = true;
    } else {
      this.disableFormatting = false;
    }
  }

  getCustomModules() {
    return {
      keyboard: {
        bindings: {
          bold: this.makeFormatHandler('bold'),
          italic: this.makeFormatHandler('italic'),
          underline: this.makeFormatHandler('underline'),
        },
      },
    };
  }

  makeFormatHandler(format: string) {
    return {
      key: format[0],
      shortKey: true,
      handler: (range: unknown, context: Context) => {
        // Don't allow formatting of 'b','u', and 'i' for headings
        if (this.isHeaderElement()) {
          return;
        }
        this.quill.format(format, !context.format[format], Quill.sources.USER);
      },
    };
  }

  isHeaderElement(): boolean {
    const el = this.getSelectionBoundaryElement(true) as HTMLElement | null;
    return el &&
      (el.tagName.startsWith('H') || el.closest('h2') || el?.closest('h3'))
      ? true
      : false;
  }

  getSelectionBoundaryElement(isStart: boolean) {
    let range, sel, container;

    sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      range = sel.getRangeAt(0);
    }

    if (range) {
      container = range[isStart ? 'startContainer' : 'endContainer'];

      // Check if the container is a text node and return its parent if so
      return container.nodeType === 3 ? container.parentNode : container;
    }
    return null;
  }
}
