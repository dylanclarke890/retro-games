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

    this.update = gameUpdate(this);
    this.render = gameRender(this);
    this.loop = new GameLoop(this);
  }
}

window.game = new Game(800, 600, 60, true);
