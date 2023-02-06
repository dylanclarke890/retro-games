import { Entity } from "../../modules/core/entity.js";
import { Register } from "../../modules/core/register.js";

export class Paddle extends Entity {
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/ball.png");
    this.addAnim("Default", 0.4, [0], false);
  }
}

export class Ball extends Entity {
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/ball.png");
    this.addAnim("Default", 0.4, [0], false);
    this.addAnim("PoweredUp", 0.4, [1], false);
  }
}

export class Brick extends Entity {
  constructor(opts) {
    super(opts);
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
const imagesPrefix = "assets/images/breakout/";
Register.preloadImages(`${imagesPrefix}paddle.png`, `${imagesPrefix}ball.png`);
