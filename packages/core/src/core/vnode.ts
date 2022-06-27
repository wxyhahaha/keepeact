import type { KComponent } from './component';

const handlers = ['onclick', 'onClick', 'onchange', 'onChange', 'oninput', 'onInput'];

type ContentType = string | Function;

export interface ComponentType {
  new (...arg): KComponent;
}

// todo 分 vText vFunction vElement 区分好做类型区分
export class VNode {
  type: ContentType;
  children: VNode[];
  elm: Node;
  text: string;
  attributes: Record<string, any>;
  listeners: Record<string, any>;
  key: string;
  constructor(type: string | any, attributes, listeners, children: any, text: string) {
    this.type = type;
    this.children = children;
    this.text = text;
    this.attributes = attributes;
    this.listeners = listeners;
    this.key = attributes && attributes.key;
  }
}

export interface VText extends VNode {
  elm: Text;
  type: string;
}

export interface VDom extends VNode {
  elm: HTMLElement;
  type: string;
}

export interface VComponent extends VNode {
  component: KComponent;
  type: ComponentType;
}

export function createVNode(type: ContentType, props: { [key: string]: any }, ...children: any[]) {
  const attributes =
    props &&
    Object.keys(props)
      .filter((v) => !handlers.includes(v))
      .reduce((pre, cur) => {
        pre[cur] = props[cur];
        return pre;
      }, {});
  const listeners =
    props &&
    Object.keys(props)
      .filter((v) => handlers.includes(v))
      .reduce((pre, cur) => {
        pre[cur] = props[cur];
        return pre;
      }, {});

  const vchildren =
    children &&
    children.flat(2).map((v) => {
      return v?.type != null ? v : createTextVNode(v);
    });
  return new VNode(type, attributes, listeners, vchildren, undefined);
}

export function createTextVNode(text) {
  return new VNode(undefined, undefined, undefined, undefined, String(text) || '');
}

export function isVText(vnode: VNode): vnode is VText {
  return vnode.text != null;
}

export function isVFunction(vnode: any) {
  return typeof vnode.type === 'function' && !(vnode.type.prototype && vnode.type.prototype.render);
}

export function isVDom(vnode: VNode): vnode is VDom {
  return typeof vnode.type === 'string';
}

export function isVComponent(vnode: VNode): vnode is VComponent {
  return typeof vnode.type === 'function' && vnode.type.prototype && vnode.type.prototype.render;
}
