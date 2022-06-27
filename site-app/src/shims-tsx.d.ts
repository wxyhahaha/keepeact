import { VNode } from 'keepeact-core';

declare global {
  namespace JSX {
    type Element = VNode;
    interface IntrinsicElements {
      [eleName: string]: any;
    }
  }
}
