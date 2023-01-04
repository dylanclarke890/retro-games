class EntityBall extends Entity {
  size = { x: 48, y: 48 };
  vel = { x: 200, y: 100 };
  collides = Entity.COLLIDES.ACTIVE;
  bounciness = 1;
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/ball.png");
    this.addAnim("Default", 0.4, [0, 1], false);
  }

  draw() {
    super.draw();
  }

  update() {
    super.update();
  }
}

class EntityPaddle extends Entity {
  size = { x: 64, y: 128 };
  collides = Entity.COLLIDES.FIXED;
  paddleSpeed = 100;
  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/paddle.png");
    this.addAnim("Default", 0.4, [0], true);
  }
}

class EntityPaddleCpu extends EntityPaddle {
  update() {
    const ball = this.game.getEntitiesByType(EntityBall)[0];
    this.vel.y =
      ball.pos.y + ball.size.y / 2 > this.pos.y + this.size.y / 2
        ? this.paddleSpeed
        : -this.paddleSpeed;
    super.update();
  }
}
class EntityPaddlePlayer extends EntityPaddle {
  update() {
    const inputState = (v) => this.game.inputEvents.state(v);
    if (inputState("up")) this.vel.y = -this.paddleSpeed;
    else if (inputState("down")) this.vel.y = this.paddleSpeed;
    else this.vel.y = 0;
    super.update();
  }
}

Register.entityTypes(EntityBall, EntityPaddleCpu, EntityPaddlePlayer);
Register.preloadAsset("assets/images/paddle.png");
