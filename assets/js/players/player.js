class Player extends Entity {
  constructor(scope, x, y) {
    super();
    this.scope = scope;
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 25;
    this.state = {
      position: { x, y },
      moveSpeed: 4,
    };
    this.keys = new KeyPressEvents();
  }

  render() {
    this.scope.ctx.fillStyle = "#40d870";
    this.scope.ctx.fillRect(this.state.position.x, this.state.position.y, this.w, this.h);
  }

  update() {
    if (this.keys.isPressed.left) this.state.position.x -= this.state.moveSpeed;
    if (this.keys.isPressed.right) this.state.position.x += this.state.moveSpeed;
    if (this.keys.isPressed.up) this.state.position.y -= this.state.moveSpeed;
    if (this.keys.isPressed.down) this.state.position.y += this.state.moveSpeed;

    this.state.position.x = this.state.position.x.constrain(0, this.scope.constants.w - this.w);
    this.state.position.y = this.state.position.y.constrain(0, this.scope.constants.h - this.h);
  }
}
