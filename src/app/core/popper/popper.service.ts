import {
  ConnectionPositionPair,
  Overlay,
  OverlayConfig,
  PositionStrategy,
} from '@angular/cdk/overlay';
import { Injectable, Injector, TemplateRef, Type } from '@angular/core';

export type PopoverContent = TemplateRef<any> | Type<any> | string;
export type PopoverParams<T> = {
  origin: HTMLElement;
  content: PopoverContent;
  data?: T;
  width?: string | number;
  height: string | number;
};

@Injectable({
  providedIn: 'root',
})
export class PopperService {
  constructor(private overlay: Overlay, private injector: Injector) {}

  open<T>(params: PopoverParams<T>) {
    const overlayRef = this.overlay.create(this.getOverlayConfig(params));
  }

  private getOverlayConfig<T>({
    origin,
    width,
    height,
  }: PopoverParams<T>): OverlayConfig {
    return new OverlayConfig({
      width,
      height,
      hasBackdrop: true,
      backdropClass: 'popover-backdrop',
      positionStrategy: this.getOverlayPosition(origin),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
  }

  private getOverlayPosition(origin: HTMLElement): PositionStrategy {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions(this.getPositions())
      .withPush(false);

    return positionStrategy;
  }

  private getPositions(): ConnectionPositionPair[] {
    return [
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
      },
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
      },
    ];
  }
}
