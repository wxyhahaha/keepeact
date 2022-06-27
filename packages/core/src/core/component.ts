import Diff from './diff';
import { mountComponent } from './mountComponent';
import { effect, reactive, ref, watch, WatchOptions } from './observe';
import Dom from './vdom';
import { ComponentType, createTextVNode, VNode } from './vnode';
export enum ChangeDetectionStrategy {
  // 需要手动调用update
  Onpush = 0,
  Default = 1,
}
interface ComponentOption {
  changeDetection: ChangeDetectionStrategy;
}

type CreateProps = Record<string, any>;

export function Component(options?: ComponentOption) {
  const s = (arg) => {};
  const r = (arg) => {};

  const stage = {
    render: r,
    setup: s,
  };

  return function (arg) {
    arg.create = function (container, p: CreateProps) {
      mountComponent(container, {
        content: arg,
        props: p,
      });
    };
    arg.prototype.$stage = options?.changeDetection ?? ChangeDetectionStrategy.Default;
    stage[ChangeDetectionStrategy[options?.changeDetection]]?.(arg);
  };
}

export function Watch(path: string, options: WatchOptions = {}) {
  return createDecorator((ctx, target, name) => {
    const cb = target[name];
    const pathList = path.trim().split('.');
    let objValue = ctx;
    let lastPath = pathList[pathList.length - 1];
    for (const key of pathList) {
      if (key === lastPath) {
        break;
      }
      objValue = objValue[key];
    }
    const obj = objValue[lastPath]['_raw'];
    const value = createComponentPropsReactive(objValue, lastPath);
    watch(typeof obj === 'object' ? value.value : () => value.value, (...arg) => cb.apply(ctx, arg), options);
  });
}

export function Prop() {
  return createDecorator(function (ctx, target, name) {
    const outValue = ctx.$props[name];
    createComponentPropsReactive(ctx, name, true, outValue);
  });
}

export function Ref(key: string) {
  return createDecorator(function (ctx, target, name) {
    ctx[name] = { isDomRef: true };
    ctx.$nextTick(() => {
      ctx[name] = ctx.$refs[key];
    });
  }, true);
}

let flushing = false;
const p = Promise.resolve();
const jobQueue = new Set<any>();
// 7.优化过渡状态更新策略
function flushJob() {
  if (!jobQueue) return;
  if (flushing) return;
  flushing = true;
  p.then(() => {
    jobQueue.forEach((fn) => {
      // 6.调度器，优化执行时机
      fn();
    });
  }).finally(() => (flushing = false));
}

export abstract class KComponent {
  $vNode: VNode;
  readonly $el: HTMLElement;
  readonly $refs: Record<string, any> = {};
  $updating = false;
  readonly $dom = new Dom(this);
  readonly $diff = new Diff(this.$dom);
  $stage;
  $props: Record<string, any>;
  $nextTick(): Promise<void>;
  $nextTick(fn: Function): void;
  $nextTick(fn?) {
    let p1;
    if (fn) {
      p.then(() => {
        fn();
      });
    } else {
      p1 = p;
    }
    return p1;
  }
  private $Decorators;
  private $RefDecorators;
  protected writeValue(value: any) {}
  static create(com: ComponentType, props: any, $el?) {
    const component = new com({ $el, ...props });
    component.$props = props;
    if (component.writeValue) {
      component.writeValue(props && props.value);
    }
    component.$RefDecorators?.forEach((fn) => fn(component));
    if (component.$stage === ChangeDetectionStrategy.Default || component.$stage == null) {
      createComponentReactive(component);
    }
    component.$Decorators?.forEach((fn) => fn(component));
    component.created();
    component.beforeMount();
    component.mount();
    component.mounted();
    return component;
  }

  constructor(arg) {
    Object.assign(this, arg);
  }

  abstract render(): VNode | null;

  created() {}

  beforeMount() {}

  mount() {
    effect(
      () => {
        this.patch();
      },
      {
        scheduler(fn) {
          jobQueue.add(fn);
          flushJob();
        },
      }
    );
  }

  mountElement() {
    this.$vNode = this.render();
    const node = this.$dom.createElement(this.$vNode) as HTMLElement;
    if (this.$el && node) {
      // this.$el.appendChild(node);
      this.$dom.insertBefore(this.$el.parentNode, node, this.$el.nextSibling);
      this.$dom.removeChild(this.$el.parentNode, this.$el);
    }
  }

  patchComponent() {
    let newVNode = this.render();
    if (!newVNode) {
      newVNode = createTextVNode('');
    }

    this.$diff.patch(this.$vNode, newVNode);

    this.$vNode = newVNode;
  }

  update() {
    if (this.$updating) {
      return;
    }
    this.$updating = true;
    Promise.resolve().then(() => {
      this.$updating = false;
      this.patch();
      this.updated();
    });
  }

  private patch() {
    if (!this.$vNode) {
      this.mountElement();
    } else {
      this.patchComponent();
    }
    // if (newVNode.elm && this.vNode.elm !== newVNode.elm) {
    //   this.vNode.elm.appendChild(newVNode.elm);
    // }
  }

  mounted() {}
  updated() {}
  destroy() {}
}

export abstract class ValueComponent extends KComponent {
  protected valueChange: (value?: any) => void;
  onChange(value?: any): void {
    if (this.valueChange) {
      this.valueChange(value);
    }
  }
}

function createComponentReactive(componentObj) {
  const obj = {};
  for (const key in componentObj) {
    if (Object.prototype.hasOwnProperty.call(componentObj, key)) {
      const element = componentObj[key];
      if (!key.startsWith('$') && !element?.isDomRef) {
        obj[key] = element;
      }
    }
  }
  const reactiveData = reactive(obj);
  for (const key in reactiveData) {
    Object.defineProperty(componentObj, key, {
      get() {
        return reactiveData[key];
      },
      set(value) {
        reactiveData[key] = value;
      },
    });
  }
}

function createComponentPropsReactive(target, key, readonly?: boolean, outValue?: any) {
  const value = ref(outValue || target[key]);
  Object.defineProperty(target, key, {
    get() {
      return value.value;
    },
    set(newValue) {
      // 只能劫持浅层，如果修改属性会修改原对象属性并触发更新
      if (readonly) {
        console.error(new Error(`Prop ${key} 属性不能修改`));
      } else {
        value.value = newValue;
      }
    },
  });
  return value;
}

export function createDecorator(factory: (ctx: KComponent, ...a) => any, isDomRef?: boolean) {
  return function (...rest) {
    const [target] = rest;
    const props = isDomRef ? '$RefDecorators' : '$Decorators';
    (target[props] || (target[props] = [])).push((ctx) => factory(ctx, ...rest));
  };
}
