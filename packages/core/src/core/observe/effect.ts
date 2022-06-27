import { arrayInstrumentations, ITERATE_KEY, TriggleType } from './reactive';

const bucket = new WeakMap();
let effectActiveFn = null;
let effectStack = []; // 4.解决嵌套问题
let shouldTrack = true;

interface EffectOptions {
  scheduler?(effectFn?: any): any;
  lazy?: boolean;
}

enum OriginMathods {
  push = 'push',
  pop = 'pop',
  shift = 'shift',
  unshift = 'unshift',
}

const orignMethods: Array<keyof typeof OriginMathods> = Object.entries<any>(OriginMathods).map<any>((v) => v[0]);
orignMethods.forEach((method) => {
  arrayInstrumentations[method] = function (...args) {
    const orignMethod = Array.prototype[method];
    // 调用前禁止追踪
    shouldTrack = false;
    const res = orignMethod.apply(this, args);
    shouldTrack = true;
    return res;
  };
});

export function effect(fn, options?: EffectOptions) {
  const effectFn = () => {
    cleanup(effectFn); // 2.减少副作用函数不必要运行
    effectActiveFn = effectFn;
    effectStack.push(effectFn);
    const res = fn();
    effectStack.pop();
    effectActiveFn = effectStack[effectStack.length - 1];
    // effectActiveFn = null;
    return res;
  };
  effectFn.deps = [];
  effectFn.options = options;
  if (!options?.lazy) {
    effectFn();
  }
  return effectFn;
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const v = effectFn.deps[i];
    v.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

// 1.weakMap（target） Map(key effectFns) Set(effectFns) 建立数据和副作用函数联系
export function track(target, key) {
  if (!effectActiveFn || !shouldTrack) {
    return;
  }

  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(effectActiveFn);
  effectActiveFn.deps.push(deps);
}

export function trigger(target, key, type?: keyof typeof TriggleType, newValue?: any) {
  let depsMap = bucket.get(target);
  if (!depsMap) {
    return;
  }
  const effects = depsMap.get(key);

  const effectToRun: any = new Set(); // 3.delete又add解决死循环

  effects?.forEach((fn) => {
    // 5.避免无限递归
    if (fn !== effectActiveFn) {
      effectToRun.add(fn);
    }
  });

  // 遍历操作
  if (type === TriggleType.ADD || type === TriggleType.DELETE) {
    const iterateEffects = depsMap.get(ITERATE_KEY);
    iterateEffects?.forEach((fn) => {
      if (fn !== effectActiveFn) {
        effectToRun.add(fn);
      }
    });
  }

  // 修改数组元素，触发收集length的副作用函数
  if (type === TriggleType.ADD && Array.isArray(target)) {
    const lengthEffects = depsMap.get('length');
    lengthEffects?.forEach((fn) => {
      if (fn !== effectActiveFn) {
        effectToRun.add(fn);
      }
    });
  }

  // 修改数组length属性
  if (key === 'length' && Array.isArray(target)) {
    depsMap.forEach((effects, key) => {
      if (key >= newValue) {
        effects?.forEach((fn) => {
          if (fn !== effectActiveFn) {
            effectToRun.add(fn);
          }
        });
      }
    });
  }
  effectToRun.forEach((fn) => {
    // 6.调度器，优化执行时机
    if (fn?.options?.scheduler) {
      fn.options.scheduler(fn);
    } else {
      fn();
    }
  });
}
