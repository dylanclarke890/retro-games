import { Entity } from "../../modules/core/entity.js";
import { Font } from "../../modules/core/font.js";
import { Register } from "../../modules/core/register.js";

export class Paddle extends Entity {
  size = { x: 72, y: 16 };
  collides = Entity.COLLIDES.FIXED;
  initialPos;
  paddleSpeed = 600;
  maxVel = { x: this.paddleSpeed, y: 0 };
  constructor(opts) {
    super(opts);
    this.initialPos = { ...this.pos };
    this.createAnimationSheet("assets/images/breakout/paddle.png");
    this.addAnim("Default", 0.4, [0], false);
  }

  resetPosition() {
    this.pos = { ...this.initialPos };
  }

  update() {
    super.update();
    if (this.game.input.state("left")) this.vel.x = -this.paddleSpeed;
    else if (this.game.input.state("right")) this.vel.x = this.paddleSpeed;
    else this.vel.x = 0;
  }
}

export class Ball extends Entity {
  size = { x: 16, y: 16 };
  maxVel = { x: 1000, y: 1000 };
  collides = Entity.COLLIDES.ACTIVE;
  bounciness = 1;
  poweredUp = false;

  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/breakout/ball.png");
    this.addAnim("Default", 0.4, [0], false);
    this.addAnim("PoweredUp", 0.4, [1], false);
    const timeOutSequence = [0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    this.addAnim("PowerUpTimingOut", 0.2, timeOutSequence, true);
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

export class PaddleLife extends Entity {
  size = { x: 16, y: 16 };
  collides = Entity.COLLIDES.NEVER;
  type = Entity.TYPE.NONE;
  checkAgainst = Entity.TYPE.NONE;

  draw() {
    const { ctx } = this.game.system;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size.x / 2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export class GameHud extends Entity {
  size = { x: this.game.system.width, y: this.game.system.height };
  collides = Entity.COLLIDES.NEVER;
  type = Entity.TYPE.NONE;
  checkAgainst = Entity.TYPE.NONE;
  maxVel = { x: 0, y: 0 };
  showEndGameMessage = false;
  showEndLevelMessage = false;
  won = false;
  lives;

  constructor(opts) {
    super(opts);
    this.lives = 3;
    this.lifeEntities = [];
    let xOffset = 72;
    const yOffset = 72;
    for (let i = 0; i < this.lives; i++, xOffset += 30)
      this.lifeEntities.push(this.game.spawnEntity(PaddleLife, xOffset, yOffset));
  }

  draw() {
    const { width } = this.game.system;
    const center = width / 2;
    const sharedOpts = { color: "green", align: Font.ALIGN.CENTER };
    if (this.showEndLevelMessage && !this.showEndGameMessage) {
      this.game.fonts.standard.write("Level Over!", center, 150, {
        size: 50,
        ...sharedOpts,
      });

      if (this.won)
        this.game.fonts.standard.write("Press 'N' to continue to the next level!", center, 200, {
          size: 30,
          ...sharedOpts,
        });
      else
        this.game.fonts.standard.write("Press 'R' to restart", center, 200, {
          size: 30,
          ...sharedOpts,
        });
    }

    if (this.showEndGameMessage) {
      this.game.fonts.standard.write("All levels complete!", center, 150, {
        size: 60,
        ...sharedOpts,
      });
      this.game.fonts.standard.write("Thanks for playing!", center, 250, {
        size: 45,
        ...sharedOpts,
      });
    }
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
