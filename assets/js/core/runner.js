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
    ...customGameOptions
  } = {}) {
    this.system = new System({ runner: this, canvasId, width, height, scale, fps });
    this.mediaFactory = new MediaFactory({ system: this.system });
    this.soundManager = new SoundManager(this);
    this.inputEvents = new InputEvents();

    this.userAgent = UserAgent.info;
    this.customGameOptions = customGameOptions;

    this.renderer = new GameRenderer({ runner: this, scale: this.system.scale });
    this.updater = new GameUpdater({ runner: this });
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
      mediaFactory: this.mediaFactory,
      ...this.customGameOptions,
    });
    this.loop.start();
  }
}
