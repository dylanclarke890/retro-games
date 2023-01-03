class EntityBall extends Entity {
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
