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
    this.mediaFactory = new MediaFactory({ system: this.system });
    this.font = this.mediaFactory.createFont(font);
    this.soundManager = new SoundManager(this);
    this.inputEvents = new InputEvents();

    this.userAgent = UserAgent.info;
    this.customGameOptions = customGameOptions;

    this.loop = new GameLoop({ runner: this, showDebugStats, targetFps: fps });
    this.ready = true;

    this.loader = new (loaderClass ?? GameLoader)({
      runner: this,
      system: this.system,
      gameClass,
      resources: this.resources,
    });
    this.loader.load();
  }

  addResource(resource) {
    if (resource) this.resources.push(resource);
  }

  setGame(gameClass) {
    if (this.running) this.newGameClass = gameClass;
    else this.setGameNow(gameClass);
  }

  setGameNow(gameClass) {
    this.game = new gameClass({
      system: this.system,
      font: this.font,
      ...this.customGameOptions,
    });
    this.loop.start();
  }
}
