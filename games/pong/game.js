import { Input } from "../../modules/core/input.js";
import { Font } from "../../modules/core/font.js";
import { Game } from "../../modules/core/game.js";
import { level } from "./level.js";
import { EventChain } from "../../modules/lib/event-chain.js";
import { EntityBall, EntityPaddle } from "./entities.js";

export class PongGame extends Game {
  SPEED_INCREASE = 0.1;
  playing = false;
  again = false;
  resetScores = false;
  score = {
    player: 0,
    opponent: 0,
  };

  constructor({ ...options } = {}) {
    super(options);
    this.input.bind(Input.KEY.UP_ARROW, "up");
    this.input.bind(Input.KEY.DOWN_ARROW, "down");
    this.input.bind(Input.KEY.SPACE, "play");
    this.loadLevel(level);
    this.initEventChain();
  }

  initEventChain() {
    const ball = this.getEntitiesByType(EntityBall)[0];
    const paddles = this.getEntitiesByType(EntityPaddle);
    ball.vel.x = 0;
    ball.vel.y = 0;
    this.chain = new EventChain()
      .waitUntil(() => this.playing)
      .then(() => {
        ball.vel = { ...ball.original.vel };
        if (!this.resetScores) return;
        this.again = false;
        this.score.player = 0;
        this.score.opponent = 0;
      })
      .waitUntil(() => ball.pos.x + ball.size.x < 0 || ball.pos.x - ball.size.x > this.system.width)
      .every(3, () => {
        const s = this.SPEED_INCREASE;
        ball.vel.x += ball.vel.x * s;
        ball.vel.y += ball.vel.y * s;
        for (let i = 0; i < paddles.length; i++) {
          const paddle = paddles[i];
          paddle.vel.x += paddle.vel.x * s;
          paddle.vel.y += paddle.vel.y * s;
        }
      })
      .then(() => {
        if (ball.pos.x + ball.size.x < 0) this.score.opponent++;
        else this.score.player++;
        ball.pos = { ...ball.original.pos };
        ball.vel = { x: 0, y: 0 };
      })
      .then(() => (this.playing = false))
      .repeatUntil(() => this.score.player > 1 || this.score.opponent > 1)
      .then(() => (this.again = true))
      .thenUntil(
        () => this.playing,
        () => this.drawGameOver()
      )
      .repeat();
  }

  draw() {
    super.draw();
    /** Extra draw logic goes here. */

    if (!this.playing) this.drawStartMessage();
    this.drawScore();
  }

  update() {
    /** Extra update logic goes here. */
    if (this.input.pressed("play")) {
      this.playing = true;
      if (this.again) {
        this.again = false;
        this.resetScores = true;
      }
    }
    this.chain.update();
    super.update();
  }

  drawStartMessage() {
    const { width } = this.system;
    const message = `Press 'SPACE' to play ${this.again ? "again" : ""}`;
    this.fonts.standard.write(message, width / 2, 250, {
      align: Font.ALIGN.CENTER,
      alpha: 1,
      color: "green",
      size: 40,
    });
  }

  drawGameOver() {
    const { width } = this.system;
    this.fonts.standard.write("GAME OVER!", width / 2, 200, {
      align: Font.ALIGN.CENTER,
      alpha: 1,
      color: "green",
      size: 60,
    });
  }

  drawScore() {
    const { width } = this.system;
    this.fonts.standard.write(`${this.score.player} - ${this.score.opponent}`, width / 2, 100, {
      align: Font.ALIGN.CENTER,
      alpha: 1,
      color: "green",
      size: 80,
    });
  }
}
