import { Input } from "./core/input.js";
import { Font } from "./core/font.js";
import { Game } from "./core/game.js";
import { GameRunner } from "./core/runner.js";
import { level } from "./levels/level.js";

export class MyGame extends Game {
  constructor({ ...options } = {}) {
    super(options);
    this.input.bind(Input.KEY.UP_ARROW, "up");
    this.input.bind(Input.KEY.DOWN_ARROW, "down");
    this.loadLevel(level);
  }

  draw() {
    super.draw();
    /** Extra draw logic goes here. */
    const { offsetWidth } = this.system.canvas;
    this.font.write("It Works!", offsetWidth / 2, 150, {
      align: Font.ALIGN.CENTER,
      alpha: 1,
      color: "green",
      size: 80,
    });
  }

  update() {
    super.update();
    /** Extra update logic goes here. */
  }
}

new GameRunner({
  canvasId: "play-area",
  gameClass: MyGame,
  fps: 60,
  width: 768,
  height: 624,
  debugMode: true,
  font: {
    path: "assets/fonts/arcade-classic.TTF",
  },
});
