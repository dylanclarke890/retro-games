const clickables = [];
let isMouseEventBound = false;

export const ClickableMixin = (superclass) =>
  class extends superclass {
    constructor(opts) {
      super(opts);

      this.game.input.initMouse();
      const canvas = this.game.system.canvas;
      canvas.addEventListener("click", () => this.clickable_onCanvasClick());
      canvas.addEventListener("touchend", () => this.clickable_onCanvasClick());

      if (!isMouseEventBound) {
        canvas.addEventListener("mousemove", () => this.onMouseMove());
        isMouseEventBound = true;
      }

      clickables.push(this);
    }

    clickable_onCanvasClick() {
      if (this.inMouseFocus() && typeof this.onClick === "function") this.onClick();
    }

    anyClickablesInFocus() {
      for (let i = 0; i < clickables.length; i++) if (clickables[i].inMouseFocus()) return true;
      return false;
    }

    onMouseMove() {
      const cursor = this.anyClickablesInFocus() ? "pointer" : "";
      this.game.system.canvas.style.cursor = cursor;
    }

    inMouseFocus() {
      const posX = this.pos.x,
        mouseX = this.game.input.mouse.x,
        screenX = this.game.screen.actual.x;
      const posY = this.pos.y,
        mouseY = this.game.input.mouse.y,
        screenY = this.game.screen.actual.y;

      return (
        posX <= mouseX + screenX &&
        mouseX + screenX <= posX + this.size.x &&
        posY <= mouseY + screenY &&
        mouseY + screenY <= posY + this.size.y
      );
    }
  };
