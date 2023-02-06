import { Game } from "../../modules/core/game.js";
// eslint-disable-next-line no-unused-vars
import { Brick } from "./entities.js";
import { level } from "./level.js";

export class BreakoutGame extends Game {
  constructor(opts) {
    super(opts);
    this.loadLevel(level);
  }
}
