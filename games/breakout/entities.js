import { Entity } from "../../modules/core/entity.js";
import { Register } from "../../modules/core/register.js";

export class Paddle extends Entity {
  size = { x: 72, y: 16 };
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/paddle.png");
    this.addAnim("Default", 0.4, [0], false);
  }
}

export class Ball extends Entity {
  size = { x: 48, y: 48 };
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/shared/ball.png");
    this.addAnim("Default", 0.4, [0], false);
    this.addAnim("PoweredUp", 0.4, [1], false);
  }
}

export class Brick extends Entity {
  size = { x: 48, y: 24 };
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/brick.png");
    this.addAnim("Default", 0.4, [0], false);
    this.addAnim("Cracked", 0.4, [1], false);
    this.addAnim("Broken", 0.4, [2], false);
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

Register.entityTypes(Paddle, Brick, Ball, MultiBallPowerup, SafetyNetPowerup, NoCollisionPowerup);
Register.preloadImages(
  "assets/images/breakout/paddle.png",
  "assets/images/breakout/brick.png",
  "assets/images/shared/ball.png"
);
