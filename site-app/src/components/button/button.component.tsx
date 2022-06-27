import { ValueComponent, Component, Watch, Prop, Ref, ChangeDetectionStrategy, computed } from 'keepeact';
import './button.component.less';

@Component({
  changeDetection: ChangeDetectionStrategy.Onpush,
})
export default class KButton extends ValueComponent {
  count = 0;
  count2 = 1;
  showStop = false;
  list = 'sdr';
  set = new Set([]);
  computed = computed(() => this.count + this.count2);
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

  constructor(arg) {
    super(arg);
  }
  mounted() {
    this.$nextTick().then(() => {
      console.log(this.buttonEl.innerText);
    });
  }

  button() {
    return (
      <button
        class={['wuxunyu', { sd: this.showStop ? true : false }]}
        style={{ fontSize: '16px', fontWeight: 'bold' }}
        onClick={() => {
          if (this.showStop) return;
          this.count++;
          this.list = '123';
          this.onChange(this.count);
          console.log(this);
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
        {this.computed.value}
        {this.countValue} {this.button()}
      </div>
    );
  }
}
