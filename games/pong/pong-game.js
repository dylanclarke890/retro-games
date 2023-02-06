import { Input } from "../../modules/core/input.js";
import { Font } from "../../modules/core/font.js";
import { Game } from "../../modules/core/game.js";
import { GameRunner } from "../../modules/core/runner.js";
import { level } from "./level.js";
import { EventChain } from "../../modules/lib/event-chain.js";
import { EntityBall } from "./pong-entities.js";

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
    this.initEventChain();
  }

  initEventChain() {
    const ball = this.getEntitiesByType(EntityBall)[0];
    this.chain = new EventChain()
      .waitUntil(() => ball.pos.x + ball.size.x < 0 || ball.pos.x - ball.size.x > this.system.width)
      .every(3, () => {
        const { x, y } = ball.vel;
        const s = ball.SPEED_INCREASE;
        ball.vel = { x: x + x * s, y: y + y * s };
      })
      .then(() => {
        if (ball.pos.x + ball.size.x < 0) this.score.opponent++;
        else this.score.player++;
      })
      .wait(3)
      .then(() => {
        ball.pos = { ...ball.original.pos };
        ball.vel = { ...ball.original.vel };
      })
      .repeatUntil(() => this.score.player > 1 || this.score.opponent > 1)
      .then(() => console.log("GAME OVER!"));
  }

  draw() {
    super.draw();
    /** Extra draw logic goes here. */
    const { width } = this.system;
    this.fonts.standard.write(`${this.score.player} - ${this.score.opponent}`, width / 2, 150, {
      align: Font.ALIGN.CENTER,
      alpha: 1,
      color: "green",
      size: 80,
    });
  }

  update() {
    /** Extra update logic goes here. */
    this.chain.update();
    super.update();
  }
}

new GameRunner({
  canvasId: "play-area",
  gameClass: PongGame,
  fps: 60,
  width: 768,
  height: 624,
  debugMode: false,
  fonts: {
    standard: "assets/fonts/arcade-classic.TTF",
    freedom: "assets/fonts/freedom.ttf",
  },
});
