import { KComponent } from './component';
import { getKebabCase } from './share';
import { ComponentType } from './vnode';
interface MountComponentProps {
  name?: string;
  content: ComponentType;
  props?: any;
}
declare var $;
export function mountComponenJq(p: MountComponentProps, jq?) {
  $ = $ ? $ : jq;
  if ($ == null) {
    console.warn('$ 为空，请正确引用jquery');
    return;
  }
  const { name, props, content } = p;
  $.fn[name] = function (...arg) {
    KComponent.create(content, arg[0], this[0]);
  };
  $(function () {
    $(`${getKebabCase(name)}`).each(function (this) {
      const $selected = $(this);
      const propsValue = props.reduce((pre, curr) => {
        pre[curr] = $selected.attr(getKebabCase(curr));
        return pre;
      }, {});
      $selected[name](propsValue);
    });
  });
}

export function mountComponent(container: HTMLElement, p: MountComponentProps) {
  const { props, content } = p;
  KComponent.create(content, props, container);
}
// const context = require.context('@/components', true, /.tsx$/);
// context.keys().forEach((v) => {
//   const component = context(v)?.default;
//   component &&
//     mountComponent({
//       name: component.name,
//       content: component,
//       props: ['valueChange'],
//     });
// });
