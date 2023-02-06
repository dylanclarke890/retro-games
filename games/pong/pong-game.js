import { Input } from "../../modules/core/input.js";
import { Font } from "../../modules/core/font.js";
import { Game } from "../../modules/core/game.js";
import { GameRunner } from "../../modules/core/runner.js";
import { level } from "./level.js";

export class PongGame extends Game {
  score = {
    player: 0,
    opponent: 0,
  };

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
    this.fonts.standard.write(
      `${this.score.player} - ${this.score.opponent}`,
      offsetWidth / 2,
      150,
      {
        align: Font.ALIGN.CENTER,
        alpha: 1,
        color: "green",
        size: 80,
      }
    );
  }

  update() {
    /** Extra update logic goes here. */
    super.update();
  }
}

new GameRunner({
  canvasId: "play-area",
  gameClass: PongGame,
  fps: 60,
  width: 768,
  height: 624,
  // debugMode: true,
  fonts: {
    standard: "assets/fonts/arcade-classic.TTF",
    freedom: "assets/fonts/freedom.ttf",
  },
});
