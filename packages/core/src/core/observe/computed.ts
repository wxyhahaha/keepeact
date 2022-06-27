import { effect, track, trigger } from './effect';

export function computed(getter) {
  let dirty = true;
  let value = null;
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      dirty = true;
      trigger(obj, 'value');
    },
  });

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn();
        dirty = false;
      }
      track(obj, 'value');
      return value;
    },
  };
  Object.defineProperty(obj, 'is_kp_computed', {
    value: true,
    enumerable: false,
    writable: false,
  });
  return obj;
}
