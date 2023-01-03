class EntityBall extends Entity {
  draw() {
    const { ctx } = this.system;
    ctx.fillStyle = "orange";
    ctx.fillRect(40, 40, 40, 40);
  }
}

registerEntity(EntityBall);
