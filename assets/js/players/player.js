class Player {
  constructor(scope, x, y) {
    this.scope = scope;
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 25;
    this.state = {
      position: { x, y },
      moveSpeed: 1.5,
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
  }
}
