# 简介

`keepeact` 是一个由 `typescript` 和 `vue.js 3.x` 数据检测机制结合而成的小型框架，写法结合现代 `jsx`，`class-style` 写法，内置 `diff` 算法和批量更新策略优化了渲染效率，打包工具为 vite，能提供较好的开发环境简单，易上手，如果想为 jq 栈提供一套简单组件 `ui`，或者其他框架也可使用它

# demo 一览

>在线演示： [demo](https://wxyhahaha.github.io/keepeact/demo/)

```tsx
import { ValueComponent, Component } from 'keepeact';
@Component()
export default class Button extends ValueComponent {
  render() {
    return <button>button</button>;
  }
}
```

# 开始

```bash
npm install keepeact-cli -g
```

# 创建安装

```bash
kp create [filename]
&
yarn
```

# 生命周期

生命周期包含了 `constructor` `writeValue` `created` `beforeMount` `mounted` `updated` `destroy`;

- **constructor** 是指该组件实例化时调用
- **writeValue** 是提供给外部传入 `value` 时，可接受 `value` 的 回调函数，实例化后调用
- **created** 当声明的属性完成数据监测时调用
- **beforeMount** 当真实 `dom` 挂载之前
- **mountd** 调用 `render`，真实 `dom` 挂载之后调用
- **updated** 当响应数据更新之后调用
- **destroy** 当组件被卸载销毁时调用

# 响应式与非响应

## 绑定属性

```tsx
...
export default class Button extends ValueComponent {
  text = 'button'; // 此处完成绑定，该值变动会引起render的执行
  render() {
    return <button>{this.text}</button>;
  }
}
```

## 响应式数据类型

除了 `Set` `Map` `weakSet` `weakMap` 数据结构外，可对普通对象，数组和其他简单类型进行响应式追踪;

此外，针对非响应式数据，还提供了 update 方法，手动更新界面;

```tsx
import { ValueComponent, Component, ChangeDetectionStrategy } from 'keepeact';

@Component()
export default class Button extends ValueComponent {
  text = 'button';
  set = new Set();
  mounted() {
    this.set.add(1);
    this.update();
  }
  render() {
    console.log(this.set); // Set([1])
    return <button>{this.text}</button>;
  }
}
```

## 非响应式

组件提供了两种更新策略, `自动更新(Default)` 和 `手动更新(Onpush)`,可供用户自由选择，更自由掌控数据响应，默认时 `Default` 模式

```tsx
...
@Component({
  changeDetection: ChangeDetectionStrategy.Onpush // 开启Onpush时，全部数据将手动
})
export default class Button extends ValueComponent {
  text = 'button';
  mounted() {
    this.text = 'button1';
    this.update();
  }
  render() {
    return <button>{this.text}</button>;
  }
}
```

## 对象方法

已经对`push`/`pop`/`shift`/`unshift` 数组方法进行劫持。并且可在 `render` 函数中使用 `includes`/`indexOf` 查询方法，对应的数据发生改变也可响应;

```tsx
...
export default class Button extends ValueComponent {
  text = 'button';
  mounted() {
    this.text = 'button1';
  }
  render() {
    console.log(this.text.includes('1')); // 第二次运行 true
    return <button>{this.text}</button>;
  }
}
```

# class 和 style 绑定

```tsx
<div 
class={['foo', { bar: true }]} 
style={{ fontSize: '16px', 'font-weight': 'bold' }}>
</div>
```
对应的html

```html
<div 
class="foo bar"
style="font-size: 16px; font-weight: bold">
</div>
```

# 计算属性和侦听器

## 计算属性

```tsx
...
export default class Button extends ValueComponent {
  count = 0;
  count1 = 1;
  get computeCount() {
    return this.count + this.count1;
  }
  render() {
    return <button>{this.computeCount}</button>;
  }
}
```

但上面方式对于性能并不是最优的，因为它没有缓存，也就是读取 `computeCount` 函数都会执行一遍,推荐用 `computed` 函数计算，暂时的唯一缺点就是访问时需要访问成员 `value` ，不过后续会考虑自动脱 `value`

```tsx
import { ValueComponent, Component } from 'keepeact';
@Component()
export default class Button extends ValueComponent {
  count = 0;
  count1 = 1;
  computeCount = computed(() => this.count + this.count1);
  render() {
    return <button>{this.computeCount.value}</button>;
  }
}
```

## 侦听器

推荐使用 `@Watch` 装饰器

```tsx
import { ValueComponent, Component, Watch } from 'keepeact';
@Component()
export default class Button extends ValueComponent {
  count = 0;
  @Watch('count')
  countChange(oldValue, newValue) {
    console.log('oldValue:', oldValue);
    console.log('newValue:', newValue);
  }
  mounted() {
    this.count++;
  }
  render() {
    return <button>{this.count}</button>;
  }
}
```

# 访问Dom元素

访问元素可使用 `@Ref` 或者 `$refs`

```tsx
import { ValueComponent, Component, Ref } from 'keepeact';
@Component()
export default class Button extends ValueComponent {
  count = 0;
  @Ref('button') buttonEl: HTMLElement;

  mounted() {
    this.$nextTick(() => {
      console.log(this.buttonEl);
      console.log(this.$refs['button'])
    });
  }

  render() {
    return <button ref="button">{this.count}</button>;
  }
}
```

# 组件通讯

## props

访问外部传进的数据可以使用 `@Prop` 接收，或者 `$props`

```tsx
// child
import { ValueComponent, Component, Prop } from 'keepeact';
@Component()
export default class Child extends ValueComponent {
  @Prop() count;
  render() {
    console.log(this.$props); // { count: 1}
    return <button>{this.count}</button>;
  }
}
```

```tsx
// parent
import { ValueComponent, Component, Prop } from 'keepeact';
@Component()
export default class Parent extends ValueComponent {
  count = 1;
  render() {
    return <Child count={this.count}></Child>;
  }
}
```

## 事件

DOM元素上绑定事件

```tsx
import { ValueComponent, Component, Prop } from 'keepeact';
@Component()
export default class Button extends ValueComponent {
  count = 0;
  render() {
    return <button onClick={() => {
      this.count++
    }}>点我{this.count}</button>;
  }
}
```

同样的事件还有 `onChange`/`onInput`

### valueChange

```tsx
// Child
import { ValueComponent, Component, Prop } from 'keepeact';
@Component()
export default class Child extends ValueComponent {
  count = 0;
  render() {
    return <button onClick={() => {
      this.count++;
      this.onChange(`count:${count}`);
    }}>点我{this.count}</button>;
  }
}
```

```tsx
// Parent
import { ValueComponent, Component, Prop } from 'keepeact';
@Component()
export default class Parent extends ValueComponent {
  render() {
    return <Child valueChange={(e) => {
      console.log(e); // count:1 count:2 count:3
    }}></Child>;
  }
}
```

# 导出使用

切记要声明 `@Component` 装饰器，因为他封装了一个 `create` 方法，便于用户将组件挂载到真实 `Dom` 上

```tsx
import { ValueComponent, Component } from 'keepeact';
@Component() // 注意要加上
export default class Button extends ValueComponent {
  text = 'button';
  render() {
    return <button>{this.text}</button>;
  }
}
```
```ts
import Button from './src/components/button';
Button.create(el, {} /*props*/);
```

