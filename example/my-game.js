import { Input } from "../modules/core/input.js";
import { Font } from "../modules/core/font.js";
import { Game } from "../modules/core/game.js";
import { GameRunner } from "../modules/core/runner.js";
import { level } from "./level.js";

import { Timer } from "../modules/lib/timer.js";
import { plugin } from "../modules/lib/inject.js";
import { GameLoop } from "../modules/core/loop.js";
import { FixedTickPlugin } from "../modules/plugins/fixed-tick.js";

plugin(FixedTickPlugin.timer).to(Timer);
plugin(FixedTickPlugin.loop).to(GameLoop);

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
    this.fonts.freedom.write("It Works!", offsetWidth / 2, 150, {
      align: Font.ALIGN.CENTER,
      alpha: 1,
      color: "green",
      size: 80,
    });
  }

  update() {
    /** Extra update logic goes here. */
    super.update();
  }
}

new GameRunner({
  canvasId: "play-area",
  gameClass: MyGame,
  fps: 60,
  width: 768,
  height: 624,
  debugMode: true,
  fonts: {
    standard: "assets/fonts/arcade-classic.TTF",
    freedom: "assets/fonts/freedom.ttf",
  },
});
