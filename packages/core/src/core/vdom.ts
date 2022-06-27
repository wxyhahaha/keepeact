import { KComponent } from './component';
import { isEmpty, toKebabCase } from './share';
import { isVComponent, isVDom, isVText, VComponent, VDom, VNode, VText } from './vnode';
export default class Dom {
  constructor(private context: KComponent) {}
  createElement(vnode: VDom): HTMLElement;
  createElement(vnode: VText): Text;
  createElement(vnode: VComponent): Node;
  createElement(vnode: VNode): Node;
  createElement(vnode: VNode): any {
    if (isVDom(vnode)) {
      const el = document.createElement(vnode.type);
      vnode.elm = el;
      if (vnode.children) {
        vnode.children.forEach((v) => {
          const node = this.createElement(v);
          node && this.appendChild(vnode.elm, node);
        });
      }
      vnode.listeners &&
        Object.keys(vnode.listeners).forEach((v) => {
          const name = v.toLowerCase().replace(/^on/, '');
          const value = vnode.listeners[v];
          vnode.elm.addEventListener(name, value);
        });
      vnode.attributes &&
        Object.keys(vnode.attributes).forEach((v) => {
          const name = v;
          const value = vnode.attributes[v];
          this.setAttribute(el, name, value);
        });
      return vnode.elm;
    } else if (isVText(vnode)) {
      const text = document.createTextNode(vnode.text);
      vnode.elm = text;
    } else if (isVComponent(vnode)) {
      vnode.component = KComponent.create(vnode.type, {
        ...vnode.listeners,
        ...vnode.attributes,
      });
      vnode.elm = vnode.component.$vNode?.elm;
    }

    return vnode.elm;
  }

  appendChild(parentNode: Node, newNode: Node) {
    parentNode.appendChild(newNode);
  }

  insertBefore(parentNode: Node, newNode: Node, node: Node) {
    parentNode.insertBefore(newNode, node);
  }

  removeChild(parentNode: Node, node: Node) {
    parentNode.removeChild(node);
  }

  removeChildren(parentNode: Node) {
    const child = parentNode.childNodes;
    for (let i = child.length - 1; i >= 0; --i) {
      this.removeChild(parentNode, child[i]);
    }
  }

  nextSibling(node: Node) {
    return node.nextSibling;
  }

  setAttribute(elm: HTMLElement, key, newValue) {
    if (key === 'valueChange') return;
    if (key === 'value') {
      elm[key] = newValue;
    } else if (key === 'ref') {
      this.context.$refs[newValue] = elm;
    } else if (key === 'style' || key === 'class') {
      const v = this.normalizeAttr(key, newValue);
      elm.setAttribute(key, v);
    } else {
      elm.setAttribute(key, newValue);
    }
  }

  styleObjToString(value: object) {
    let str: string;
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const v = value[key];
        const k = toKebabCase(key);
        if (v) {
          if (!str) {
            str = `${k}:${v}`;
          } else {
            str += `;${k}:${v}`;
          }
        }
      }
    }
    return str;
  }

  classObjToString(value: object) {
    let str: string;
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const v = value[key];
        if (v) {
          if (!str) {
            str = key;
          } else {
            str += ` ${key}`;
          }
        }
      }
    }
    return str;
  }

  normalizeAttr(attrKey: string, value: string | object | Array<string | object>): string {
    let str: string;
    if (typeof value === 'string') {
      return str;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      if (attrKey === 'class') {
        str = this.classObjToString(value);
      } else if (attrKey === 'style') {
        str = this.styleObjToString(value);
      }
    } else if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === 'string') {
          if (!isEmpty(v)) {
            if (!str) {
              str = v;
            } else {
              str += ` ${v}`;
            }
          }
        } else if (typeof v === 'object' && !Array.isArray(v)) {
          const c = this.normalizeAttr(attrKey, v);
          if (c) {
            str += ` ${c}`;
          }
        }
      }
    }
    return str;
  }

  updateVDom(elm: Node, oldVNode: VNode, newVnode: VNode) {
    if (isVDom(newVnode) && elm instanceof HTMLElement) {
      // 新增属性
      newVnode.attributes &&
        Object.keys(newVnode.attributes).forEach((key) => {
          const oldValue = oldVNode.attributes[key];
          const newValue = newVnode.attributes[key];
          if (oldValue === newValue) {
            return;
          } else if (!isEmpty(newValue)) {
            this.setAttribute(elm, key, newValue);
          }
        });
      // 删除属性
      oldVNode.attributes &&
        Object.keys(oldVNode.attributes).forEach((key) => {
          const newValue = newVnode.attributes[key];
          if (isEmpty(newValue)) {
            elm.removeAttribute(key);
          }
        });

      // 新增监听
      newVnode.listeners &&
        Object.keys(newVnode.listeners).forEach((key) => {
          const oldValue = oldVNode.listeners[key];
          const newValue = newVnode.listeners[key];
          const handleName = key.toLowerCase().replace(/^on/, '');
          if (oldValue === newValue) {
            return;
          } else if (!isEmpty(newValue)) {
            if (!isEmpty(oldValue)) {
              elm.removeEventListener(handleName, oldValue);
            }
            elm.addEventListener(handleName, newValue);
          }
        });

      // 删除监听
      oldVNode.listeners &&
        Object.keys(oldVNode.listeners).forEach((key) => {
          const newValue = newVnode.listeners[key];
          const handleName = key.toLowerCase().replace(/^on/, '');
          if (isEmpty(newValue)) {
            elm.addEventListener(handleName, newValue);
          }
        });
    }
  }
}
