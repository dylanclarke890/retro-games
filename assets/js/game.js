class Game {
  constructor(w, h, targetFps, showFps) {
    this.constants = {
      w,
      h,
      targetFps,
      showFps,
    };
    this.state = {};

    this.viewport = generateCanvas(w, h);
    this.ctx = this.viewport.getContext("2d");
    document.body.insertBefore(this.viewport, document.body.firstChild);
  }

  render() {
    const { w, h } = this.constants;
    this.ctx.clearRect(0, 0, w, h);

    this.ctx.font = "32px Arial";
    this.ctx.fillStyle = "#fff";
    this.ctx.fillText("It's dangerous to travel this route alone.", 5, 50);

    // Displaying FPS.
    if (this.constants.showFps) {
      this.ctx.fillStyle = "#ff0";
      this.ctx.fillText("FPS", w - 100, 50);
    }

    if (this.state.hasOwnProperty("entities")) {
      const entities = scope.state.entities;
      for (let entity in entities) entities[entity].render();
    }
  }

  update(tFrame) {
    if (this.state.hasOwnProperty("entities")) {
      const entities = this.state.entities;
      for (let entity in entities) entities[entity].update();
    }
  }
}

window.game = new Game(800, 600, 60, true);
