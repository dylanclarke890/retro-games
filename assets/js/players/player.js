class Player {
  constructor(scope, x, y) {
    this.scope = scope;
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 25;
    this.state = {
      position: { x, y },
      movementSpeed: 1.5,
    };
  }

  render() {
    scope.ctx.fillStyle = "#40d870";
    scope.ctx.fillRect(this.state.position.x, this.state.position.y, this.w, this.h);
  }

  update() {}
}
