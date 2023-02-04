class TouchButton {
  action = "undefined";
  image = null;
  tile = 0;
  pos = { x: 0, y: 0 };
  size = { x: 0, y: 0 };
  area = { x1: 0, y1: 0, x2: 0, y2: 0 };

  pressed = false;
  touchId = 0;
  anchor = null;

  constructor(action, anchor, width, height, image, tile) {
    this.action = action;
    this.anchor = anchor;
    this.size = { x: width, y: height };

    this.image = image || null;
    this.tile = tile || 0;
  }

  align(w, h) {
    if ("left" in this.anchor) this.pos.x = this.anchor.left;
    else if ("right" in this.anchor) this.pos.x = w - this.anchor.right - this.size.x;

    if ("top" in this.anchor) this.pos.y = this.anchor.top;
    else if ("bottom" in this.anchor) this.pos.y = h - this.anchor.bottom - this.size.y;

    var internalWidth = parseInt(ig.system.canvas.offsetWidth) || ig.system.realWidth;
    var s = ig.system.scale * (internalWidth / ig.system.realWidth);
    this.area = {
      x1: this.pos.x * s,
      y1: this.pos.y * s,
      x2: (this.pos.x + this.size.x) * s,
      y2: (this.pos.y + this.size.y) * s,
    };
  }

  touchStart(ev) {
    if (this.pressed) {
      return;
    }

    var pos = { left: 0, top: 0 };
    if (ig.system.canvas.getBoundingClientRect) {
      pos = ig.system.canvas.getBoundingClientRect();
    }

    for (var i = 0; i < ev.touches.length; i++) {
      var touch = ev.touches[i];
      if (this.checkStart(touch.identifier, touch.clientX - pos.left, touch.clientY - pos.top)) {
        return;
      }
    }
  }

  touchEnd(ev) {
    if (!this.pressed) {
      return;
    }

    for (var i = 0; i < ev.changedTouches.length; i++) {
      if (this.checkEnd(ev.changedTouches[i].identifier)) {
        return;
      }
    }
  }

  touchStartMS(ev) {
    if (this.pressed) {
      return;
    }

    var pos = { left: 0, top: 0 };
    if (ig.system.canvas.getBoundingClientRect) {
      pos = ig.system.canvas.getBoundingClientRect();
    }

    this.checkStart(ev.pointerId, ev.clientX - pos.left, ev.clientY - pos.top);
  }

  touchEndMS(ev) {
    if (!this.pressed) {
      return;
    }

    this.checkEnd(ev.pointerId);
  }

  checkStart(id, x, y) {
    if (x > this.area.x1 && x < this.area.x2 && y > this.area.y1 && y < this.area.y2) {
      this.pressed = true;
      this.touchId = id;

      ig.input.actions[this.action] = true;
      if (!ig.input.locks[this.action]) {
        ig.input.presses[this.action] = true;
        ig.input.locks[this.action] = true;
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

class TouchButtonCollection = ig.Class.extend({
  buttons: [],

  init(buttons) {
    this.buttons = buttons;

    document.addEventListener("touchstart", this.touchStart.bind(this), false);
    document.addEventListener("touchend", this.touchEnd.bind(this), false);

    document.addEventListener("MSPointerDown", this.touchStartMS.bind(this), false);
    document.addEventListener("MSPointerUp", this.touchEndMS.bind(this), false);
    document.body.style.msTouchAction = "none";
  },

  touchStart(ev) {
    ev.preventDefault();

    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].touchStart(ev);
    }
  },

  touchEnd(ev) {
    ev.preventDefault();

    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].touchEnd(ev);
    }
  },

  touchStartMS(ev) {
    ev.preventDefault();

    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].touchStartMS(ev);
    }
  },

  touchEndMS(ev) {
    ev.preventDefault();

    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].touchEndMS(ev);
    }
  },

  align() {
    var w = ig.system.width || window.innerWidth;
    var h = ig.system.height || window.innerHeight;

    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].align(w, h);
    }
  },

  draw() {
    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].draw();
    }
  },
});
