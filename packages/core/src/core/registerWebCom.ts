import { getKebabCase } from './share';
import { KComponent } from './component';

/**
 * todo
 */
export default function registerWebCom() {
  const component = undefined;
  class ComponentELement extends HTMLElement {
    constructor() {
      super();
      console.log(Array.from(this.attributes));
      setTimeout(() => {
        KComponent.create(component, {}, this);
      });
    }
  }
  window.customElements.define(getKebabCase(component.name), ComponentELement);
}
