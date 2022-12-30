class KeyPressEvents {
  constructor() {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;

    document.onkeydown = (e) => {
      switch (e.code) {
        case "ArrowRight":
          this.right = true;
          break;
        case "ArrowLeft":
          this.left = true;
          break;
        case "ArrowUp":
          this.up = true;
          break;
        case "ArrowDown":
          this.down = true;
          break;
        default:
          break;
      }
    };

    document.onkeyup = (e) => {
      switch (e.code) {
        case "ArrowRight":
          this.right = false;
          break;
        case "ArrowLeft":
          this.left = false;
          break;
        case "ArrowUp":
          this.up = false;
          break;
        case "ArrowDown":
          this.down = false;
          break;
        default:
          break;
      }
    };
  }

  get isPressed() {
    return {
      left: this.left,
      right: this.right,
      up: this.up,
      down: this.down,
    };
  }
}
