import { Game } from "../../modules/core/game.js";
import { Input } from "../../modules/core/input.js";
import { removeItem } from "../../modules/lib/array-utils.js";
import { EventChain } from "../../modules/lib/event-chain.js";
import { Ball, Brick, GameHud, Paddle } from "./entities.js";
import { level1 } from "./level-1.js";
import { level2 } from "./level-2.js";

export class BreakoutGame extends Game {
  playing = false;
  currentLevel;
  initialBallVel = { x: 300, y: -300 };
  currentSpeedIncrease = 0;
  ballSpeedIncrease = 0.1;
  static levels = [level1, level2];

  constructor(opts) {
    super(opts);
    this.currentLevel = 1;
    this.loadLevel();
    this.initChain();

    this.input.bind(Input.KEY.SPACE, "play");
    this.input.bind(Input.KEY.R, "restart");
    this.input.bind(Input.KEY.N, "nextLevel");
    this.input.bind(Input.KEY.LEFT_ARROW, "left");
    this.input.bind(Input.KEY.RIGHT_ARROW, "right");
  }

  initChain() {
    const initialBallPos = this.getEntitiesByType(Ball)[0].pos;
    this.chain = new EventChain()
      .waitUntil(() => this.playing)
      .then(() => {
        const ball = this.getEntitiesByType(Ball)[0];
        ball.vel = { ...this.initialBallVel };
      })
      .waitUntil(() => this.getEntitiesByType(Brick).length === 0)
      .orUntil(() => this.getEntitiesByType(Ball).length === 0)
      .whilst(() => {
        const balls = this.getEntitiesByType(Ball);
        const { height } = this.system;
        for (let i = 0; i < balls.length; i++) {
          const ball = balls[i];
          if (ball.pos.y + ball.size.y > height) ball.kill();
        }
      })
      .every(2, () => {
        const balls = this.getEntitiesByType(Ball);
        for (let i = 0; i < balls.length; i++) {
          const ball = balls[i];
          ball.vel.x += ball.vel.x * this.ballSpeedIncrease;
          ball.vel.y += ball.vel.y * this.ballSpeedIncrease;
        }
      })
      .then(() => {
        if (this.getEntitiesByType(Brick).length === 0) {
          this.playing = false;
          this.hud.won = true;
          this.hud.showEndLevelMessage = true;
        } else if (this.getEntitiesByType(Ball).length === 0) {
          this.playing = false;
          if (this.hud.lifeEntities.length) {
            const entity = this.hud.lifeEntities[this.hud.lifeEntities.length - 1];
            entity.kill();
            removeItem(this.hud.lifeEntities, entity);
          }
          this.getEntitiesByType(Paddle)[0].resetPosition();
          this.spawnEntity(Ball, initialBallPos.x, initialBallPos.y);
        }
      })
      .repeatUntil(() => --this.hud.lives < 0)
      .then(() => {
        if (this.hud.showEndLevelMessage) return; // already showing the 'you win' screen
        this.playing = false;
        this.hud.won = false;
        this.hud.showEndGameMessage = true;
      });
  }

  loadLevel() {
    super.loadLevel(BreakoutGame.levels[this.currentLevel]);
    this.hud = this.spawnEntity(GameHud, 0, 0, {});
    if (this.chain) this.chain.reset();
  }

  nextLevel() {
    this.currentLevel++;
    const next = BreakoutGame.levels[this.currentLevel];
    if (!next) this.displayEndOfGameScreen();
    else this.levelToLoad = next;
  }

  restart() {
    this.playing = false;
    this.loadLevel();
  }

  update() {
    super.update();
    if (this.hud.lives < 0 && this.input.state("restart")) this.restart();
    if (this.hud.won && this.input.state("nextLevel")) this.nextLevel();
    if (!this.playing) if (this.input.state("play")) this.playing = true;
    this.chain.update();
  }
}
