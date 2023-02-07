import { Entity } from "../../modules/core/entity.js";
import { Font } from "../../modules/core/font.js";
import { Register } from "../../modules/core/register.js";
import { EventChain } from "../../modules/lib/event-chain.js";

export class Paddle extends Entity {
  size = { x: 72, y: 16 };
  collides = Entity.COLLIDES.FIXED;
  paddleSpeed = 600;
  maxVel = { x: this.paddleSpeed, y: 0 };
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/paddle.png");
    this.addAnim("Default", 0.4, [0], false);
  }

  update() {
    super.update();
    if (this.game.input.state("left")) this.vel.x = -this.paddleSpeed;
    else if (this.game.input.state("right")) this.vel.x = this.paddleSpeed;
    else this.vel.x = 0;
  }
}

export class Ball extends Entity {
  size = { x: 48, y: 48 };
  collides = Entity.COLLIDES.ACTIVE;
  bounciness = 1;
  initialVel = { x: 200, y: -200 };
  poweredUp = false;

  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/shared/ball.png");
    this.addAnim("Default", 0.4, [0], false);
    this.addAnim("PoweredUp", 0.4, [1], false);
    const timeOutSequence = [0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    this.addAnim("PowerUpTimingOut", 0.2, timeOutSequence, true);
    this.chain = new EventChain()
      .waitUntil(() => this.poweredUp)
      .then(() => (this.currentAnim = this.anims.PoweredUp))
      .wait(2)
      .then(() => (this.currentAnim = this.anims.PowerUpTimingOut))
      .waitUntil(() => this.currentAnim.loopCount > 0)
      .then(() => (this.currentAnim = this.anims.Default))
      .repeat();
  }
}

export class Brick extends Entity {
  size = { x: 48, y: 24 };
  collides = Entity.COLLIDES.FIXED;
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/brick.png");
    this.addAnim("Broken", 0.4, [2], false);
    this.addAnim("Default", 0.4, [0], false);
    this.addAnim("Cracked", 0.4, [1], false);
  }

  collideWith() {
    super.collideWith();
    switch (this.currentAnim) {
      case this.anims.Default:
        this.currentAnim = this.anims.Cracked;
        break;
      case this.anims.Cracked:
        this.currentAnim = this.anims.Broken;
        break;
      case this.anims.Broken:
        this.kill();
        break;
      default:
        break;
    }
  }
}

export class GameHud extends Entity {
  size = { x: this.game.system.width, y: this.game.system.height };
  collides = Entity.COLLIDES.NEVER;
  type = Entity.TYPE.NONE;
  checkAgainst = Entity.TYPE.NONE;
  maxVel = { x: 0, y: 0 };
  show = false;

  draw() {
    if (!this.show) return;
    const { width } = this.system;
    this.fonts.standard.write("Level Over!", width / 2, 150, {
      color: "green",
      size: 50,
      align: Font.ALIGN.CENTER,
    });
  }
}

class PowerupBase extends Entity {
  constructor(opts) {
    super(opts);
  }
}

export class MultiBallPowerup extends PowerupBase {}
export class SafetyNetPowerup extends PowerupBase {}
export class NoCollisionPowerup extends PowerupBase {}

Register.entityTypes(
  Paddle,
  Brick,
  Ball,
  GameHud,
  MultiBallPowerup,
  SafetyNetPowerup,
  NoCollisionPowerup
);

Register.preloadImages(
  "assets/images/breakout/paddle.png",
  "assets/images/breakout/brick.png",
  "assets/images/shared/ball.png"
);
