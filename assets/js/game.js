class Game {
  constructor({ w, h, targetFps, showDebugStats } = {}) {
    this.state = {};

    const [ctx, scale] = GameRenderer.newRenderContext(w, h);
    this.ctx = ctx;
    this.viewport = ctx.canvas;
    document.body.insertBefore(this.viewport, document.body.firstChild);

    this.constants = {
      w,
      h,
      targetFps,
      showDebugStats,
      scale,
    };

    this.state.entities = {};
    this.state.entities.player = new Player(this, this.constants.w / 2, this.constants.h - 100);

    this.updater = new GameUpdater(this);
    this.renderer = new GameRenderer(this);
    this.loop = new GameLoop(this);
    this.loop.start();

    const stopBtn = document.getElementById("stop");
    stopBtn.addEventListener("click", () => this.loop.stop());
  }
}

window.game = new Game({ w: 800, h: 600, targetFps: 60, showDebugStats: true });
