import { effect } from './effect';

export interface WatchOptions {
  immediate?: boolean;
  deep?: boolean;
}

export function watch(source, cb, options: WatchOptions = {}) {
  let getter;
  if (typeof source === 'function') {
    getter = source;
  } else if (typeof source === 'object') {
    getter = () => (options.deep ? traverse(source) : source);
  } else {
    console.error(`${source} 不是一个函数或者对象`);
  }
  let oldValue;
  let cleanup;
  // 供用户解决竟态问题
  function onInValidate(fn) {
    cleanup = fn;
  }
  const job = () => {
    const newValue = effectFn();
    if (cleanup) {
      cleanup();
    }
    cb(oldValue, newValue, onInValidate);
    oldValue = newValue;
  };
  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler: job,
  });
  if (options.immediate) {
    job();
  } else {
    oldValue = effectFn();
  }
}

export function traverse(value: Object, seen = new Set()) {
  if (value == null || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      traverse(value[key], seen);
    }
  }
  return value;
}
