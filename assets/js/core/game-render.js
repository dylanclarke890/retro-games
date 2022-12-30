class GameRenderer {
  constructor(scope) {
    this.scope = scope;
  }

  render() {
    this.clear();

    const scope = this.scope;

    // Example text
    scope.ctx.font = "32px Arial";
    scope.ctx.fillStyle = "#fff";
    scope.ctx.fillText("It's dangerous to travel this route alone.", 5, 50);

    // Calling entity render methods
    if (scope.state["entities"] !== undefined)
      for (let entity in scope.state.entities) scope.state.entities[entity].render();
  }

  clear(color) {
    const { w, h } = this.scope.constants;
    if (color) {
      scope.ctx.fillStyle = "#fff";
      scope.ctx.fillRect(0, 0, w, h);
    } else this.scope.ctx.clearRect(0, 0, w, h);
  }
}
