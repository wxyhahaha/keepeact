import { ValueComponent, Component, Watch, Prop, Ref } from 'keepeact';
import './button.component.less';

@Component()
export default class KButton extends ValueComponent {
  count = 0;
  showStop = false;
  @Prop() defaultCount: number;
  @Ref('button') buttonEl: HTMLElement;
  @Watch('count', {
    immediate: true,
  })
  countChange(a, b) {
    console.log('监测 count:', `oldValue: ${a}`, `newValue: ${b}`);
    this.showStop = this.count > 6;
  }

  get countValue() {
    return this.showStop ? 'stop' : this.count;
  }

  button() {
    this.$nextTick(() => {
      console.log(this.buttonEl.innerText);
    });

    return (
      <button
        class={['wuxunyu', { sd: this.showStop ? true : false }]}
        style={{ fontSize: '16px', fontWeight: 'bold' }}
        onClick={() => {
          if (this.showStop) return;
          this.count++;
          this.onChange(this.count);
        }}
      >
        点我+1
      </button>
    );
  }
  destroy() {
    console.log('摧毁');
  }
  render() {
    return (
      <div id="wuxunyu" ref="button">
        {this.countValue} {this.button()}
      </div>
    );
  }
}
