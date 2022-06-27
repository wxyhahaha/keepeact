import { Component, ValueComponent } from 'keepeact';
import KButton from './button/button.component';

@Component()
export default class WelCome extends ValueComponent {
  buttonDemo() {
    return (
      <KButton
        valueChange={(e) => {
          this.onChange(e);
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
          <li>{this.buttonDemo()}</li>
        </ul>
      </div>
    );
    return welcomeWrapper;
  }
}
