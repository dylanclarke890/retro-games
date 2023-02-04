export class TouchButton {
  action = "undefined";
  image = null;
  tile = 0;
  pos = { x: 0, y: 0 };
  size = { x: 0, y: 0 };
  area = { x1: 0, y1: 0, x2: 0, y2: 0 };

  pressed = false;
  touchId = 0;
  anchor = null;

  constructor(input, system, action, anchor, width, height, image, tile) {
    this.input = input;
    this.system = system;
    this.action = action;
    this.anchor = anchor;
    this.size = { x: width, y: height };
    this.image = image;
    this.tile = tile || 0;
  }

  align(w, h) {
    if ("left" in this.anchor) this.pos.x = this.anchor.left;
    else if ("right" in this.anchor) this.pos.x = w - this.anchor.right - this.size.x;

    if ("top" in this.anchor) this.pos.y = this.anchor.top;
    else if ("bottom" in this.anchor) this.pos.y = h - this.anchor.bottom - this.size.y;

    const internalWidth = parseInt(this.system.canvas.offsetWidth) || this.system.realWidth;
    const s = this.system.scale * (internalWidth / this.system.realWidth);
    this.area = {
      x1: this.pos.x * s,
      y1: this.pos.y * s,
      x2: (this.pos.x + this.size.x) * s,
      y2: (this.pos.y + this.size.y) * s,
    };
  }

  touchStart(ev) {
    if (this.pressed) return;

    const pos = this.system.canvas.getBoundingClientRect();
    for (let i = 0; i < ev.touches.length; i++) {
      const { identifier, clientX, clientY } = ev.touches[i];
      if (this.checkStart(identifier, clientX - pos.left, clientY - pos.top)) return;
    }
  }

  touchEnd(ev) {
    if (!this.pressed) return;

    for (let i = 0; i < ev.changedTouches.length; i++)
      if (this.checkEnd(ev.changedTouches[i].identifier)) return;
  }

  touchStartMS(ev) {
    if (this.pressed) return;
    const pos = this.system.canvas.getBoundingClientRect();
    this.checkStart(ev.pointerId, ev.clientX - pos.left, ev.clientY - pos.top);
  }

  touchEndMS(ev) {
    if (!this.pressed) return;
    this.checkEnd(ev.pointerId);
  }

  checkStart(id, x, y) {
    if (x > this.area.x1 && x < this.area.x2 && y > this.area.y1 && y < this.area.y2) {
      this.pressed = true;
      this.touchId = id;
      this.input.actions[this.action] = true;
      if (!this.input.locks[this.action]) {
        this.input.presses[this.action] = true;
        this.input.locks[this.action] = true;
      }
      return true;
    }

    return false;
  }

  checkEnd(id) {
    if (id === this.touchId) {
      this.pressed = false;
      this.touchId = 0;
      this.input.delayedKeyup[this.action] = true;
      return true;
    }

    return false;
  }

  draw() {
    if (this.image)
      this.image.drawTile(this.pos.x, this.pos.y, this.tile, this.size.x, this.size.y);
  }
}

export class TouchButtonCollection {
  buttons = [];

  constructor(system, input, buttons) {
    this.system = system;
    this.input = input;
    this.buttons = buttons;
    document.addEventListener("touchstart", (e) => this.touchStart(e), false);
    document.addEventListener("touchend", (e) => this.touchEnd(e), false);
    document.addEventListener("MSPointerDown", (e) => this.touchStartMS(e), false);
    document.addEventListener("MSPointerUp", (e) => this.touchEndMS(e), false);
    document.body.style.msTouchAction = "none";
  }

  touchStart(ev) {
    ev.preventDefault();

    for (let i = 0; i < this.buttons.length; i++) this.buttons[i].touchStart(ev);
  }

  touchEnd(ev) {
    ev.preventDefault();
    for (let i = 0; i < this.buttons.length; i++) this.buttons[i].touchEnd(ev);
  }

  touchStartMS(ev) {
    ev.preventDefault();
    for (let i = 0; i < this.buttons.length; i++) this.buttons[i].touchStartMS(ev);
  }

  touchEndMS(ev) {
    ev.preventDefault();
    for (let i = 0; i < this.buttons.length; i++) this.buttons[i].touchEndMS(ev);
  }

  align() {
    const w = this.system.width || window.innerWidth;
    const h = this.system.height || window.innerHeight;
    for (let i = 0; i < this.buttons.length; i++) this.buttons[i].align(w, h);
  }

  draw() {
    for (let i = 0; i < this.buttons.length; i++) this.buttons[i].draw();
  }
}
