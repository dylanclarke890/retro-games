export const EdgesMixin = (superclass) =>
  class extends superclass {
    constructor(opts) {
      super(opts);
      Object.defineProperties(this, {
        left: {
          get() {
            return this.pos.x;
          },
        },
        right: {
          get() {
            return this.pos.x + this.size.x;
          },
        },
        top: {
          get() {
            return this.pos.y;
          },
        },
        bottom: {
          get() {
            return this.pos.y + this.size.y;
          },
        },
      });
    }
  };
