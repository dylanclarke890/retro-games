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
class EntityPaddleCpu extends Entity {}
class EntityPaddlePlayer extends Entity {}

Register.entities(EntityBall, EntityPaddleCpu, EntityPaddlePlayer);
