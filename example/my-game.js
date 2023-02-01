import { Input } from "../modules/core/input.js";
import { Font } from "../modules/core/font.js";
import { Game } from "../modules/core/game.js";
import { GameRunner } from "../modules/core/runner.js";
import { level } from "./level.js";

import { EntityRetroHighscoreNameField } from "../modules/plugins/retro-highscore-namefield.js";

export class MyGame extends Game {
  constructor({ ...options } = {}) {
    super(options);
    this.input.bind(Input.KEY.UP_ARROW, "up");
    this.input.bind(Input.KEY.DOWN_ARROW, "down");

    this.loadLevel(level);
    this.retroNameField = this.spawnEntity(EntityRetroHighscoreNameField, 50, 100, {
      fontNormal: this.fonts.standard,
      fontHighlighted: this.fonts.freedom,
      numberOfChars: 3,
      letterSpacing: 20,
    });
  }

  draw() {
    this.system.clear();
    const nameField = this.getEntitiesByType(EntityRetroHighscoreNameField)[0];
    nameField.draw();
    // super.draw();
    // /** Extra draw logic goes here. */
    // const { offsetWidth } = this.system.canvas;
    // this.fonts.freedom.write("It Works!", offsetWidth / 2, 150, {
    //   align: Font.ALIGN.CENTER,
    //   alpha: 1,
    //   color: "green",
    //   size: 80,
    // });
  }

  update() {
    // super.update();
    const nameField = this.getEntitiesByType(EntityRetroHighscoreNameField)[0];
    nameField.update();
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
  fonts: {
    standard: "assets/fonts/arcade-classic.TTF",
    freedom: "assets/fonts/freedom.ttf",
  },
});
