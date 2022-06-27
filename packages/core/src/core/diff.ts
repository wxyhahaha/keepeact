import { isEmpty } from './share';
import Dom from './vdom';
import { isVComponent, isVDom, isVText, VNode } from './vnode';

export default class Diff {
  constructor(private dom: Dom) {}
  sameVNode(a: VNode, b: VNode): any {
    if (a.type === b.type && a.key === b.key && this.sameInputType(a, b)) {
      return true;
    }
  }

  sameInputType(a: VNode, b: VNode) {
    if (a.type !== 'input') {
      return true;
    }
    const a1 = a.attributes.type;
    const b1 = b.attributes.type;
    if (a1 == null && b1 == null) {
      return true;
    }
    return a1 === b1;
  }

  patch(oldVNode: VNode, newVNode: VNode) {
    this.checkDuplicateKeys(newVNode.children);
    if (this.sameVNode(oldVNode, newVNode)) {
      this.patchVNode(oldVNode, newVNode);
    } else {
      // 不相等
      // 将新的插到旧的前面，再移除旧的
      const oldElmParent = oldVNode.elm.parentNode;
      this.dom.createElement(newVNode);
      this.dom.insertBefore(oldElmParent, newVNode.elm, oldVNode.elm);
      this.dom.removeChild(oldElmParent, oldVNode.elm);
    }
  }

  patchVNode(oldVNode: VNode, newVNode: VNode) {
    if (newVNode === oldVNode) {
      return;
    }

    const elm = (newVNode.elm = oldVNode.elm);
    if (isVText(newVNode)) {
      if (isVText(oldVNode) && newVNode.text !== oldVNode.text) {
        oldVNode.elm.data = newVNode.text;
      }
    } else if (isVDom(oldVNode) && isVDom(newVNode)) {
      this.dom.updateVDom(elm, oldVNode, newVNode);
      if (!isEmpty(oldVNode.children) && !isEmpty(newVNode.children) && oldVNode.children !== newVNode.children) {
        //当新旧节点children同时存在时,精细化比较
        this.updateChildren(elm, oldVNode.children, newVNode.children);
      } else if (!isEmpty(newVNode.children)) {
        // 当新节点有children，旧节点没有children时，直接新增节点
        newVNode.children.forEach((v) => {
          this.dom.createElement(v);
          this.dom.appendChild(elm, v.elm);
        });
      } else if (!isEmpty(oldVNode.children)) {
        // 当旧节点有children，新节点没有children时，删除节点
        this.dom.removeChildren(elm);
      }
    }

    if (isVComponent(oldVNode) && isVComponent(newVNode)) {
      newVNode.component = oldVNode.component;
    }
  }

  updateChildren(parentNode: Node, oldChild: VNode[], newChild: VNode[]) {
    let oldStartIndx = 0;
    let newStartIndx = 0;
    let oldEndIndx = oldChild.length - 1;
    let newEndIndx = newChild.length - 1;
    let oldStartNode = oldChild[0];
    let oldEndNode = oldChild[oldEndIndx];
    let newStartNode = newChild[0];
    let newEndNode = newChild[newEndIndx];
    let keyMap;

    while (oldStartIndx <= oldEndIndx && newStartIndx <= newEndIndx) {
      if (oldEndNode == null) {
        // 移动节点时会发生 oldChild[index] = undefined
        oldEndNode = oldChild[--oldEndIndx];
      } else if (oldStartNode == null) {
        // 移动节点时会发生 oldChild[index] = undefined
        oldStartNode = oldChild[++oldStartIndx];
      } else if (this.sameVNode(oldStartNode, newStartNode)) {
        this.patchVNode(oldStartNode, newStartNode);
        oldStartNode = oldChild[++oldStartIndx];
        newStartNode = newChild[++newStartIndx];
      } else if (this.sameVNode(oldEndNode, newEndNode)) {
        this.patchVNode(oldEndNode, newEndNode);
        oldEndNode = oldChild[--oldEndIndx];
        newEndNode = newChild[--newEndIndx];
      } else if (this.sameVNode(oldStartNode, newEndNode)) {
        this.patchVNode(oldStartNode, newEndNode);
        this.dom.insertBefore(parentNode, oldStartNode.elm, this.dom.nextSibling(oldEndNode.elm));
        oldStartNode = oldChild[++oldStartIndx];
        newEndNode = newChild[--newEndIndx];
      } else if (this.sameVNode(oldEndNode, newStartNode)) {
        this.patchVNode(oldEndNode, newStartNode);
        this.dom.insertBefore(parentNode, oldEndNode.elm, oldStartNode.elm);
        oldEndNode = oldChild[--oldEndIndx];
        newStartNode = newChild[++newStartIndx];
      } else {
        if (!keyMap) keyMap = this.oldVNodeKeyToMap(oldChild, oldStartIndx, oldEndIndx);
        const indexInold = keyMap.get(newStartNode.key);
        if (indexInold == null) {
          // 新增
          this.dom.createElement(newStartNode);
          this.dom.insertBefore(parentNode, newStartNode.elm, oldStartNode.elm);
        } else {
          // 新旧节点存在相同key
          const oldNode = oldChild[indexInold];
          if (this.sameVNode(oldNode, newStartNode)) {
            this.patchVNode(oldNode, newStartNode);
            oldChild[indexInold] = undefined; // 移动节点，将旧的删除
            this.dom.insertBefore(parentNode, oldNode.elm, oldStartNode.elm);
          } else {
            // 相同key但不同element
            this.dom.createElement(newStartNode);
            this.dom.insertBefore(parentNode, newStartNode.elm, oldStartNode.elm);
          }
        }
        newStartNode = newChild[++newStartIndx];
      }
    }
    if (oldStartIndx > oldEndIndx) {
      // 有新增
      const provit = newChild[newEndIndx + 1];
      const elm = provit ? provit.elm : null;
      for (; newStartIndx <= newEndIndx; newStartIndx++) {
        this.dom.createElement(newChild[newStartIndx]);
        this.dom.insertBefore(parentNode, newChild[newStartIndx].elm, elm);
      }
    } else if (newStartIndx > newEndIndx) {
      // 销毁
      for (; oldStartIndx <= oldEndIndx; oldStartIndx++) {
        if (oldChild[oldStartIndx]) {
          this.dom.destroyComponents(oldChild[oldStartIndx]);
          this.dom.removeChild(parentNode, oldChild[oldStartIndx].elm);
        }
      }
    }
  }

  oldVNodeKeyToMap(oldChild: VNode[], start: number, end: number) {
    const map = new Map();
    for (let i = start; i <= end; i++) {
      const v = oldChild[i];
      if (v.key) {
        map.set(v.key, i);
      }
    }
    return map;
  }

  checkDuplicateKeys(child: VNode[]) {
    const seen = {};
    for (const vnode of child) {
      const key = vnode.key;
      if (!isEmpty(key)) {
        if (seen[key]) {
          console.warn(`Duplicate keys detected: '${key}'. This may cause an update error.`, vnode);
        } else {
          seen[key] = true;
        }
      }
    }
  }
}
