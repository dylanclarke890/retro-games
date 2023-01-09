class GameRunner {
  #customGameOptions = null;
  #font = null;
  #loader = null;
  #loop = null;
  #mediaFactory = null;
  #soundManager = null;

  debugSystem = null;
  game = null;
  newGameClass = null; // TODO: link up to run() in loop
  ready = false;
  system = null;

  constructor({
    canvasId,
    gameClass,
    fps,
    width,
    height,
    scale,
    loaderClass,
    debugMode,
    showStats,
    font,
    ...customGameOptions
  } = {}) {
    this.system = new System({ runner: this, canvasId, width, height, scale, fps });
    this.#soundManager = new SoundManager(this);
    this.#mediaFactory = new MediaFactory({
      system: this.system,
      soundManager: this.#soundManager,
    });
    this.#loop = new GameLoop({ runner: this, showStats, targetFps: fps });
    this.#font = this.#mediaFactory.createFont(font);
    this.customGameOptions = customGameOptions;

    this.ready = true;
    loaderClass ??= GameLoader;
    this.#loader = new loaderClass({
      runner: this,
      gameClass,
      debugMode,
    });

    if (debugMode) {
      console.log("Loading debug mode...");
      this.debugSystem = new DebugSystem({ system: this.system });
      DebugSystem.injectDebugMethods({
        systemClass: System,
        gameClass,
        baseEntityClass: Entity,
        gameLoopClass: GameLoop,
        debugSystemInstance: this.debugSystem,
      });
    }
    this.#loader.load();
  }

  setGame(gameClass) {
    if (this.running) this.newGameClass = gameClass;
    else this.setGameNow(gameClass);
  }

  setGameNow(gameClass) {
    this.game = new gameClass({
      system: this.system,
      font: this.#font,
      mediaFactory: this.#mediaFactory,
      ...this.#customGameOptions,
    });
    this.#loop.start();
  }
}
