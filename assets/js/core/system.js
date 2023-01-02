class System {
  fps = 60;
  width = 600;
  height = 800;
  realWidth = 600;
  realHeight = 800;
  scale = 1;

  tick = 0;
  animationId = 0;
  newGameClass = null;
  running = false;

  clock = null;
  canvas = null;
  context = null;
  #runner = null;

  constructor({ runner, canvasId = null, width, height, fps, scale }) {
    if (!runner) throw new Error("Runner is required.");
    this.canvasId = canvasId ?? 1; // TODO: random id generator.
    this.canvas = document.createElement("canvas");
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.scale = scale;
    this.#runner = runner;
  }

  setGame(gameClass) {
    if (this.running) this.newGameClass = gameClass;
    else this.setGameNow(gameClass);
  }

  setGameNow(gameClass) {
    this.#runner.game = new gameClass({
      mediaFactory: this.#runner.mediaFactory,
      ...this.#runner.customOptions,
    });
  }
}
