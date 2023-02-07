import { Game } from "../../modules/core/game.js";
import { Input } from "../../modules/core/input.js";
import { EventChain } from "../../modules/lib/event-chain.js";
import { Ball, Brick, GameHud } from "./entities.js";

import { level } from "./level.js";

export class BreakoutGame extends Game {
  playing = false;

  constructor(opts) {
    super(opts);
    this.loadLevel(level);
    this.spawnEntity(GameHud, 0, 0, {});
    this.input.bind(Input.KEY.SPACE, "play");
    this.input.bind(Input.KEY.LEFT_ARROW, "left");
    this.input.bind(Input.KEY.RIGHT_ARROW, "right");
    const ball = this.getEntitiesByType(Ball)[0];
    this.chain = new EventChain()
      .waitUntil(() => this.playing)
      .then(() => (ball.vel = { ...ball.initialVel }))
      .waitUntil(() => this.getEntitiesByType(Brick).length === 0)
      .orUntil(() => ball.killed === true)
      .every(2, () => {
        ball.vel.x += ball.vel.x * 0.1;
        ball.vel.y += ball.vel.y * 0.1;
      })
      .then(() => {
        if (this.getEntitiesByType(Brick).length === 0) {
          this.won = true;
          this.playing = false;
        }
      });
  }

  update() {
    super.update();
    if (!this.playing) {
      if (this.input.state("play")) {
        this.playing = true;
        this.won = false;
      }
    }
    this.chain.update();
  }
}
