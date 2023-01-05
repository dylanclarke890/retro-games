class GameRunner {
  resources = [];
  ready = false;
  game = null;

  constructor({
    canvasId,
    gameClass,
    fps,
    width,
    height,
    scale,
    loaderClass,
    showDebugStats,
    font,
    ...customGameOptions
  } = {}) {
    this.system = new System({ runner: this, canvasId, width, height, scale, fps });
    this.soundManager = new SoundManager(this);
    this.mediaFactory = new MediaFactory({ system: this.system, soundManager: this.soundManager });
    this.loop = new GameLoop({ runner: this, showDebugStats, targetFps: fps });
    this.userAgent = UserAgent.info;
    this.font = this.mediaFactory.createFont(font);
    this.customGameOptions = customGameOptions;

    this.ready = true;
    loaderClass ??= GameLoader;
    this.loader = new loaderClass({
      runner: this,
      gameClass,
      resources: this.resources,
    });
    this.loader.load();
  }

  setGame(gameClass) {
    if (this.running) this.newGameClass = gameClass;
    else this.setGameNow(gameClass);
  }

  setGameNow(gameClass) {
    this.game = new gameClass({
      system: this.system,
      font: this.font,
      mediaFactory: this.mediaFactory,
      ...this.customGameOptions,
    });
    this.loop.start();
  }
}
