import '@angular/core';

declare module '@angular/core' {
  /** Present in later Angular; Language Service TCBs may emit this on ngModel bindings. */
  export function ɵassertType<T>(value: T): T;
}
