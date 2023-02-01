export const FixedEntityMixin = (superclass) =>
  class extends superclass {
    constructor(opts) {
      super(opts);
      if (this.fixed) this.fixedPos = { ...this.pos };
    }

    draw() {
      if (this.fixed) {
        const { x, y } = this.game.screen.actual;
        this.pos.x = this.fixedPos.x + x;
        this.pos.y = this.fixedPos.y + y;
      }
      super.draw();
    }
  };
