import { Input } from "../modules/core/input.js";

export class EventedInput extends Input {
  delayedKeyup = { push: function () {}, length: 0 };
  keydownCallback = null;
  keyupCallback = null;
  mousemoveCallback = null;

  keydown(event) {
    if (this.targetIsInputOrText(event)) return;
    const code =
      event.type === "keydown"
        ? event.keyCode
        : event.button === 2
        ? Input.KEY.MOUSE2
        : Input.KEY.MOUSE1;

    const action = this.bindings[code];
    if (!action) return;
    if (!this.actions[action]) {
      this.actions[action] = true;
      if (this.keydownCallback) this.keydownCallback(action);
    }
    event.stopPropagation();
    event.preventDefault();
  }

  keyup(event) {
    if (this.targetIsInputOrText(event)) return;
    const code =
      event.type === "keyup"
        ? event.keyCode
        : event.button === 2
        ? Input.KEY.MOUSE2
        : Input.KEY.MOUSE1;

    const action = this.bindings[code];
    if (!action) return;
    this.actions[action] = false;
    if (this.keyupCallback) this.keyupCallback(action);
    event.stopPropagation();
    event.preventDefault();
  }

  mousewheel(event) {
    const delta = event.wheelDelta ? event.wheelDelta : event.detail * -1;
    const code = delta > 0 ? Input.KEY.MWHEEL_UP : Input.KEY.MWHEEL_DOWN;
    const action = this.bindings[code];
    if (!action) return;
    if (this.keyupCallback) this.keyupCallback(action);
    event.stopPropagation();
    event.preventDefault();
  }

  mousemove(event) {
    super.mousemove(event);
    if (this.mousemoveCallback) this.mousemoveCallback();
  }
}
