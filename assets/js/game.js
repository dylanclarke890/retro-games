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

    this.state.entities = this.state.entities || {};
    this.state.entities.player = new Player(this, this.constants.w / 2, this.constants.h - 100);
    
    this.updater = new GameUpdater(this);
    this.renderer = new GameRenderer(this);
    this.loop = new GameLoop(this);
    this.loop.start();
  }
}

window.game = new Game(800, 600, 60, true);
