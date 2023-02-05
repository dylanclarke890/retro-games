export const EdgesMixin = (superclass) =>
  class extends superclass {
    /** @type {"rectangle" | "circle"} */
    collisionShape = "rectangle";

    constructor(opts) {
      super(opts);
    }

    get left() {
      switch (this.collisionShape) {
        case "rectangle":
        default:
          return this.pos.x;
        case "circle":
          return this.pos.x - this.size.r;
      }
    }

    get right() {
      switch (this.collisionShape) {
        case "rectangle":
        default:
          return this.pos.x + this.size.x;
        case "circle":
          return this.pos.x + this.size.r;
      }
    }

    get centerX() {
      switch (this.collisionShape) {
        case "rectangle":
        default:
          return this.pos.x + this.size.x / 2;
        case "circle":
          return this.pos.x;
      }
    }

    get top() {
      switch (this.collisionShape) {
        case "rectangle":
        default:
          return this.pos.y - this.size.y;
        case "circle":
          return this.pos.y - this.r;
      }
    }

    get bottom() {
      switch (this.collisionShape) {
        case "rectangle":
        default:
          return this.pos.y + this.size.y;
        case "circle":
          return this.pos.y + this.r;
      }
    }

    get centerY() {
      switch (this.collisionShape) {
        case "rectangle":
        default:
          return this.pos.y + this.size.y / 2;
        case "circle":
          return this.pos.y;
      }
    }
  };
