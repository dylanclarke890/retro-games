import { Entity } from "../../modules/core/entity.js";
import { Register } from "../../modules/core/register.js";
import { Paddle } from "./entities.js";

export class PowerupBase extends Entity {
  _levelEditorIgnore = true;

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
  _levelEditorIgnore = true;
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
export class SafetyNetPowerup extends PowerupBase {
  _levelEditorIgnore = true;
}

export class SafetyNet extends Entity {
  _levelEditorIsScalable = true;
  _levelEditorDrawBox = true;
  _levelEditorBoxColor = "orange";
}

export class NoCollisionPowerup extends PowerupBase {
  _levelEditorIgnore = true;
}

Register.entityTypes(MultiBallPowerup, SafetyNetPowerup, SafetyNet, NoCollisionPowerup);
Register.preloadImages("assets/images/breakout/multi-ball.png");
