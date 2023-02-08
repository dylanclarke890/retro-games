import { Entity } from "../../modules/core/entity.js";
import { Register } from "../../modules/core/register.js";
import { Paddle } from "./entities.js";

export class PowerupBase extends Entity {
  gravityFactor = 1;
  vel = { x: 0, y: 50 };
  size = { x: 24, y: 24 };
  collides = Entity.COLLIDES.PASSIVE;
  checkAgainst = Entity.TYPE.A;

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

  checkWith(other) {
    if (!(other instanceof Paddle)) return;
    super.checkWith(other);
  }

  collideWith(other) {
    this.game.onPowerupCollected(this);
    super.collideWith(other);
    this.kill();
  }
}
export class SafetyNetPowerup extends PowerupBase {}
export class NoCollisionPowerup extends PowerupBase {}

Register.entityTypes(MultiBallPowerup, SafetyNetPowerup, NoCollisionPowerup);
Register.preloadImages("assets/images/breakout/multi-ball.png");
