import { VNode } from 'keepeact';

declare global {
  namespace JSX {
    type Element = VNode;
    interface IntrinsicElements {
      [eleName: string]: any;
    }
  }
}
