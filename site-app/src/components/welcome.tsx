import { Component, ValueComponent } from 'keepeact';
import KButton from './button/button.component';

@Component()
export default class WelCome extends ValueComponent {
  aa = 1;
  buttonDemo() {
    return (
      <KButton
        valueChange={(e) => {
          this.onChange(e);
          this.aa++;
        }}
      ></KButton>
    );
  }
  render() {
    const welcomeWrapper = (
      <div>
        <p>WelCome to Keepeact, I wish you like it.</p>
        <p>demo: </p>
        <ul>
          <li>
            <button
              onClick={() => {
                this.aa++;
                if (this.aa > 10) {
                  this.aa = 0;
                }
              }}
            ></button>
          </li>
          <li>{this.aa < 4 ? this.buttonDemo() : 'aaaaaaaaaaaaa'}</li>
        </ul>
      </div>
    );
    return welcomeWrapper;
  }
}
