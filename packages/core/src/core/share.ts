export function isEmpty(value: any) {
  return Array.isArray(value) ? value.length === 0 : value == null;
}

// 驼峰/下划线 转 短横线命名(kebab-case)
export function getKebabCase(str: string): string {
  const reg = /^([A-Z$]+)/g;
  const reg2 = /_([a-zA-Z$]+)/g;
  const reg3 = /([A-Z$]+)/g;
  return str
    .replace(reg, ($, $1) => $1.toLowerCase())
    .replace(reg2, ($, $1) => '-' + $1.toLowerCase())
    .replace(reg3, ($, $1) => '-' + $1.toLowerCase());
}

export const toKebabCase = (value: string) => value.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

export function readonly(obj, key) {
  Object.defineProperty(obj, key, {
    writable: false,
  });
}
