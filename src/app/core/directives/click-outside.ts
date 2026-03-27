import { Directive, ElementRef, inject, OnDestroy, output, Renderer2 } from '@angular/core';

@Directive({
  selector: '[clickOutside]'
})
export class ClickOutsideDirective implements OnDestroy {

  clickOutside = output<void>();
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private listener: (() => void) | null = null;
  private isFirstClick = true;

  constructor() {
    this.listener = this.renderer.listen('document', 'click', (e: Event) => {
      if(this.isFirstClick) {
        this.isFirstClick = false;
        return;
      }
      if(!this.elementRef.nativeElement.contains(e.target)) {
        this.clickOutside.emit();
      }
    })
  }

  ngOnDestroy() {
    this.listener?.();
  }

}
