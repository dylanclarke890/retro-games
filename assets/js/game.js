class Game {
  #resources = [];
  #imageCache = {};
  #drawCount = 0;

  constructor({ w, h, targetFps, showDebugStats } = {}) {
    this.state = {};
    this.ready = false;

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

    if (this.constants.scale !== 1) this.renderer.scaleMode = this.renderer.SCALE.CRISP;
    this.renderer.scaleMode(this.ctx);

    const stopBtn = document.getElementById("stop");
    stopBtn.addEventListener("click", () => this.loop.stop());

    this.loop = new GameLoop(this);
    this.loop.start();
    this.ready = true;
  }

  addResource(resource) {
    this.#resources.push(resource);
  }

  imageDrawn() {
    this.#drawCount++;
  }

  get totalImagesDrawn() {
    return this.#drawCount;
  }

  cacheImage(key, image) {
    this.#imageCache[key] = image;
  }
}

// window.game = new Game({ w: 800, h: 600, targetFps: 60, showDebugStats: true });
