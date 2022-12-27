function gameRender(scope) {
  const { w, h } = scope.constants;
  return function render() {
    scope.ctx.clearRect(0, 0, w, h);

    scope.ctx.font = "32px Arial";
    scope.ctx.fillStyle = "#fff";
    scope.ctx.fillText("It's dangerous to travel this route alone.", 5, 50);

    // Displaying FPS.
    if (scope.constants.showFps) {
      scope.ctx.fillStyle = "#ff0";
      scope.ctx.font = "12px Arial";
      scope.ctx.fillText(`FPS ${scope.fps}`, w - 60, 20);
    }

    if (scope.state.hasOwnProperty("entities")) {
      const entities = scope.state.entities;
      for (let entity in entities) {
        entities[entity].render();
      }
    }
  };
}
