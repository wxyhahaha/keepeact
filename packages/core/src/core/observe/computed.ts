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
  return obj;
}
