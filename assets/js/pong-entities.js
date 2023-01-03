class EntityBall extends Entity {
  size = { x: 48, y: 48 };
  collides = Entity.COLLIDES.ACTIVE;

  constructor(opts) {
    super(opts);
    this.createAnimationSheet("assets/images/ball.png");
    this.addAnim("Default", 90, [0], true);
  }

  draw() {
    super.draw();
    const { ctx } = this.game.system;
    ctx.fillStyle = "orange";
    ctx.fillRect(300, 240, 40, 40);
  }

  update() {
    super.update();
  }
}
class EntityPaddleCpu extends Entity {}
class EntityPaddlePlayer extends Entity {}

Register.entities(EntityBall, EntityPaddleCpu, EntityPaddlePlayer);
