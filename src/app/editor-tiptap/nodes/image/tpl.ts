import { ApplicationRef, EmbeddedViewRef, TemplateRef } from '@angular/core';
import { Content } from 'tippy.js';

export interface ViewRef {
  getElement(): Content | null;
  detectChanges?(): void;
  destroy?(): void;
}

interface CustomTmlRefArgs<C> {
  tpl: TemplateRef<C>;
  appRef: ApplicationRef;
}

export class TplRef<C> implements ViewRef {
  private viewRef: EmbeddedViewRef<C> | null;
  private element!: Element | null;

  constructor(private args: CustomTmlRefArgs<C>) {
    this.viewRef = this.args.tpl.createEmbeddedView({} as C);
    this.viewRef.detectChanges();
    this.args.appRef.attachView(this.viewRef);
  }

  detectChanges() {
    this.viewRef?.detectChanges();
    return this;
  }

  getElement(): Element | null {
    if (!this.viewRef) return null;

    const rootNodes = this.viewRef.rootNodes;

    if (rootNodes.length === 1 && rootNodes[0].nodeType === Node.ELEMENT_NODE) {
      this.element = rootNodes[0];
    } else {
      this.element = document.createElement('div');
      this.element.append(...rootNodes);
    }

    return this.element;
  }

  destroy() {
    if (!this.viewRef) return;

    if (this.viewRef.rootNodes[0] !== 1) {
      this.element?.parentNode?.removeChild(this.element);
      this.element = null;
    }

    this.viewRef.destroy();
    this.viewRef = null;
  }
}

// Reference

// const tpl = this.imageTooltip();
// if (tpl) {
//   const ref = new TplRef({ tpl: tpl, appRef: this.appRef });
//   this.tippyRef = tippy('#image', {
//     content: ref.getElement() as unknown as string,
//     placement: 'right',
//     interactive: true,
//     allowHTML: true,
//     trigger: 'click',
//   });
//   this.tippyRef?.[0].show();
// }
