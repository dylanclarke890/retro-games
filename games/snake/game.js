import { Game } from "../../modules/core/game.js";
import { Input } from "../../modules/core/input.js";

export class SnakeGame extends Game {
  constructor(opts) {
    super(opts);
    this.input.bind(Input.KEY.LEFT_ARROW, "left");
    this.input.bind(Input.KEY.RIGHT_ARROW, "right");
  }

  draw() {
    super.draw();
  }

  update() {
    super.update();
  }
}
