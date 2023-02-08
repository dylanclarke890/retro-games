import { Entity } from "../../modules/core/entity.js";
import { Register } from "../../modules/core/register.js";
import { Timer } from "../../modules/lib/timer.js";
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

export class MultiBallPowerup extends PowerupBase {
  _levelEditorIgnore = true;
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/multi-ball.png");
    this.addAnim("Default", 0.4, [0], false);
  }
}
export class SafetyNetPowerup extends PowerupBase {
  _levelEditorIgnore = true;

  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/shield.png");
    this.addAnim("Default", 0.4, [0], false);
  }
}

export class SafetyNet extends Entity {
  _levelEditorIsScalable = true;
  _levelEditorDrawBox = true;
  _levelEditorBoxColor = "orange";

  collides = Entity.COLLIDES.PASSIVE;
  timer;

  constructor(opts) {
    super(opts);
    this.timer = new Timer();
  }

  setActiveFor(duration) {
    this.collides = Entity.COLLIDES.FIXED;
    this.timer.set(duration);
  }

  draw() {
    if (this.collides !== Entity.COLLIDES.FIXED) return;
    const { ctx } = this.game.system;
    ctx.strokeStyle = "lightblue";
    ctx.strokeRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
  }

  update() {
    if (this.collides === Entity.COLLIDES.FIXED && this.timer.delta() > 0)
      this.collides = Entity.COLLIDES.PASSIVE;
    super.update();
  }
}

export class NoCollisionPowerup extends PowerupBase {
  _levelEditorIgnore = true;

  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/damage-increase.png");
    this.addAnim("Default", 0.4, [0], false);
  }
}

Register.entityTypes(MultiBallPowerup, SafetyNetPowerup, SafetyNet, NoCollisionPowerup);

Register.preloadImages(
  "assets/images/breakout/multi-ball.png",
  "assets/images/breakout/shield.png",
  "assets/images/breakout/damage-increase.png"
);
