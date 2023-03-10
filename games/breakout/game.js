import { Game } from "../../modules/core/game.js";
import { Input } from "../../modules/core/input.js";
import { randomItem, removeItem } from "../../modules/lib/array-utils.js";
import { EventChain } from "../../modules/lib/event-chain.js";
import { Ball, Brick, GameHud, Paddle } from "./entities.js";
import {
  MultiBallPowerup,
  NoCollisionPowerup,
  PowerupBase,
  SafetyNet,
  SafetyNetPowerup,
} from "./powerups.js";
import { level1 } from "./level-1.js";
import { level2 } from "./level-2.js";
import { Timer } from "../../modules/lib/timer.js";
import { randomIntFromInterval } from "../../modules/lib/number-utils.js";

export class BreakoutGame extends Game {
  playing = false;
  currentLevel;
  initialBallVel = { x: 200, y: -200 };
  currentSpeedIncrease = 0;
  ballSpeedIncrease = 0.1;
  noCollisionTimer;
  static Levels = [level1, level2];
  static Powerups = [SafetyNetPowerup, NoCollisionPowerup, MultiBallPowerup];
  static PowerupDropChance = 0.25;
  static MultiBallSpawnAmount = 2;
  static SafetyNetDuration = 5;
  static NoCollisionDuration = 5;

  constructor(opts) {
    super(opts);
    this.currentLevel = 0;
    this.loadLevel();
    this.initChain();

    this.input.bind(Input.KEY.SPACE, "play");
    this.input.bind(Input.KEY.R, "restart");
    this.input.bind(Input.KEY.N, "nextLevel");
    this.input.bind(Input.KEY.LEFT_ARROW, "left");
    this.input.bind(Input.KEY.RIGHT_ARROW, "right");

    this.noCollisionTimer = new Timer();
  }

  initChain() {
    const initialBallPos = this.getEntitiesByType(Ball)[0].pos;
    this.mainChain = new EventChain()
      .waitUntil(() => this.playing)
      .then(() => {
        const ball = this.getEntitiesByType(Ball)[0];
        ball.vel.x = randomIntFromInterval(this.initialBallVel.x - 20, this.initialBallVel.x + 20);
        ball.vel.y = randomIntFromInterval(this.initialBallVel.y - 20, this.initialBallVel.y + 20);
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
          const powerups = this.getEntitiesByType(PowerupBase);
          for (let i = 0; i < powerups.length; i++) powerups[i].kill();
        }
      })
      .repeatUntil(() => --this.hud.lives < 0)
      .then(() => {
        if (this.hud.showEndLevelMessage) return; // already showing the 'you win' screen
        this.playing = false;
        this.hud.won = false;
        this.hud.showEndLevelMessage = true;
      });
  }

  onBrickDestroyed(x, y) {
    if (Math.random() <= BreakoutGame.PowerupDropChance)
      this.spawnEntity(randomItem(BreakoutGame.Powerups), x, y);
  }

  onPowerupCollected(powerup) {
    const balls = this.getEntitiesByType(Ball);
    switch (powerup.constructor.name) {
      case "MultiBallPowerup":
        for (let i = 0; i < balls.length; i++) {
          const { x, y } = balls[i].pos;
          for (let i = 0; i < BreakoutGame.MultiBallSpawnAmount; i++) {
            const ball = this.spawnEntity(Ball, x, y);
            let velX = randomIntFromInterval(
              this.initialBallVel.x - 20,
              this.initialBallVel.x + 20
            );
            let velY = randomIntFromInterval(
              this.initialBallVel.y - 20,
              this.initialBallVel.y + 20
            );
            if (Math.random() > 0.5) velX = -velX;
            if (Math.random() > 0.5) velY = -velY;
            ball.vel = { x: velX, y: velY };
          }
        }
        break;
      case "SafetyNetPowerup":
        this.getEntitiesByType(SafetyNet)[0].setActiveFor(BreakoutGame.SafetyNetDuration);
        break;
      case "NoCollisionPowerup":
        this.noCollisionTimer.set(BreakoutGame.NoCollisionDuration);
        break;
      default:
        break;
    }
  }

  loadLevel() {
    super.loadLevel(BreakoutGame.Levels[this.currentLevel]);
    this.hud = this.spawnEntity(GameHud, 0, 0, {});
    if (this.mainChain) this.mainChain.reset();
  }

  nextLevel() {
    this.currentLevel++;
    const next = BreakoutGame.Levels[this.currentLevel];
    if (!next) this.hud.showEndGameMessage = true;
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
    this.mainChain.update();
  }
}
