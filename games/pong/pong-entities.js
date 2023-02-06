import { Register } from "../../modules/core/register.js";
import { Entity } from "../../modules/core/entity.js";

export class EntityBall extends Entity {
  name = "Ball baby";
  size = { x: 48, y: 48 };
  vel = { x: 250, y: 100 };
  collides = Entity.COLLIDES.ACTIVE;
  bounciness = 1;
  hitSound;

  constructor(opts) {
    super(opts);

    this.hitSound = this.game.media.createSound({ path: "assets/sounds/collision.mp3" });
    this.createAnimationSheet("assets/images/ball.png");
    this.addAnim("Default", 0.4, [0, 1], false);
  }

  collideWith(other) {
    super.collideWith(other);
    // this.hitSound.play(); uncomment to play sound
  }
}

export class EntityPaddle extends Entity {
  name = "Paddle";
  size = { x: 64, y: 128 };
  collides = Entity.COLLIDES.FIXED;
  paddleSpeed = 150;
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/paddle.png");
    this.addAnim("Default", 0.4, [0], true);
  }
}

export class EntityPaddleCpu extends EntityPaddle {
  constructor(opts) {
    super(opts);
  }

  update() {
    const ball = this.game.getEntitiesByType(EntityBall)[0];
    this.vel.y =
      ball.pos.y + ball.size.y / 2 > this.pos.y + this.size.y / 2
        ? this.paddleSpeed
        : -this.paddleSpeed;
    super.update();
  }
}
export class EntityPaddlePlayer extends EntityPaddle {
  update() {
    const inputState = (v) => this.game.input.state(v);
    if (inputState("up")) this.vel.y = -this.paddleSpeed;
    else if (inputState("down")) this.vel.y = this.paddleSpeed;
    else this.vel.y = 0;
    super.update();
  }
}

Register.entityTypes(EntityBall, EntityPaddleCpu, EntityPaddlePlayer);
Register.preloadImages("assets/images/paddle.png", "assets/images/ball.png");
Register.preloadSounds("assets/sounds/collision.mp3");