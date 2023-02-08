import { Entity } from "../../modules/core/entity.js";
import { Register } from "../../modules/core/register.js";

class PowerupBase extends Entity {
  gravityFactor = 1;
  vel = { x: 0, y: 50 };
  size = { x: 24, y: 24 };
  constructor(opts) {
    super(opts);
  }
}

export class MultiBallPowerup extends PowerupBase {
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/multi-ball.png");
    this.addAnim("Default", 0.4, [0], false);
  }
}
export class SafetyNetPowerup extends PowerupBase {}
export class NoCollisionPowerup extends PowerupBase {}

Register.entityTypes(MultiBallPowerup, SafetyNetPowerup, NoCollisionPowerup);
Register.preloadImages("assets/images/breakout/multi-ball.png");
