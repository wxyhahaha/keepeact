import { track, trigger } from './effect';

export enum TriggleType {
  ADD = 'ADD',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
}

enum SearchOriginMathods {
  includes = 'includes',
  indexOf = 'indexOf',
}

export const arrayInstrumentations = {};
// 先从代理对象查找是否存在，否则在原对象查找
const searchOriginMathods: Array<keyof typeof SearchOriginMathods> = Object.entries<any>(SearchOriginMathods).map<any>((v) => v[0]);
searchOriginMathods.forEach((method) => {
  arrayInstrumentations[method] = function (...args) {
    const orignMethod = Array.prototype[method];
    // this 是代理对象
    let res = orignMethod.apply(this, args);
    if (res === false || res === -1) {
      // _raw 是原对象
      res = orignMethod.apply(this['_raw'], args);
    }
    return res;
  };
});

export const ITERATE_KEY = Symbol();
type Obj = Record<string | symbol, any> | Array<any>;
type Ref = { value: any };

/**
 *
 * receiver 指的是代理对象，并且不随原型访问而改变
 * @returns
 */
function createReactive(obj: Obj, isShallow?: boolean, isReadonly?: boolean): Obj {
  const data = new Proxy(obj, {
    get(target, key, receiver) {
      if (key === '_raw') {
        return target;
      }

      if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }
      if (!isReadonly) {
        track(target, key);
      }

      const res = Reflect.get(target, key, receiver);
      if (isShallow) {
        return res;
      }
      if (typeof res === 'object' && res != null) {
        return isReadonly ? readonly(res) : reactive(res);
      }
      return res;
    },
    set(target, key, newValue, receiver) {
      if (isReadonly) {
        console.error(`属性: [${String(key)}] 只读`);
        return true;
      }
      const oldValue = target[key];
      const type = Array.isArray(target)
        ? Number(key) < target.length
          ? TriggleType.EDIT
          : TriggleType.ADD
        : target[key]
        ? TriggleType.EDIT
        : TriggleType.ADD;
      const res = Reflect.set(target, key, newValue, receiver);
      /**
       * 原型读取问题
       * @example const obj = {};
        const proto = { bar: 1 };
        const parent = reactive(proto);
        const child = reactive(obj);
        // parent 作为child的原型 proto
        Object.setPrototypeOf(child, parent);
        // 读取child属性 由于child不存在bar 会读取原型，导致收集两次副作用
        effect(() => {
          console.log(child.bar);
        });

        child.bar++ // 会执行两次副作用
       */

      const isTarget = () => receiver._raw === target;
      if (isTarget()) {
        // 合理触发
        if (oldValue !== newValue && (oldValue === oldValue || newValue === newValue)) {
          trigger(target, key, type, newValue);
        }
      }
      return res;
    },
    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      const res = Reflect.deleteProperty(target, key);
      if (hadKey && res) {
        trigger(target, key, TriggleType.DELETE);
      }
      return res;
    },
    has(target, key) {
      // in object
      track(target, key);
      return Reflect.has(target, key);
    },
    ownKeys(target) {
      // 对象处理 for in
      // 遍历key
      // 新增/删除 触发副作用函数的执行
      // 修改值则不用触发,减少性能开销
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
  });
  return data;
}

// 访问对象的值是对象时会重新创建代理对象，导致 a.b !== a.b 会不相等，阻止重复创建
const reactiveMap = new Map();
export function reactive(obj: Obj) {
  const exisit = reactiveMap.get(obj);
  if (exisit) return exisit;
  const proxy = createReactive(obj);
  reactiveMap.set(obj, proxy);
  return proxy;
}

export function shallowReactive(obj): any {
  return createReactive(obj, true);
}

export function ref(value): Ref {
  const wrapper = {
    value,
  };
  Object.defineProperty(wrapper, '__is_ref', {
    value: true,
  });
  return reactive(wrapper);
}

export function shallowRef(value): Ref {
  const wrapper = {
    value,
  };
  Object.defineProperty(wrapper, '__is_ref', {
    value: true,
  });
  return shallowReactive(wrapper);
}

export function readonly(obj) {
  return createReactive(obj, false, true);
}

export function shallowReadonly(obj) {
  return createReactive(obj, true, true);
}

// 1. for in
// 2. for of
// 3. 对象和数组
