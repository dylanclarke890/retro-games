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
  #imageCache = {};

  constructor({ runner, canvasId = null, width, height, scale }) {
    if (!runner) throw new Error("Runner is required.");

    const [ctx, actualScale] = GameRenderer.newRenderContext({
      id: canvasId,
      w: width,
      h: height,
      scale,
    });
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    document.body.insertBefore(this.canvas, document.body.firstChild);
    this.scale = actualScale;
    // TODO - cache "real" width and height using scale.
    this.width = width;
    this.height = height;

    this.#runner = runner;
  }

  get ready() {
    return this.#runner.ready;
  }

  addResource(resource) {
    this.#runner.resources.push(resource);
  }

  cacheImage(path, image) {
    this.#imageCache[path] = image;
  }

  reloadCache() {
    for (let path in this.#imageCache) this.#imageCache[path].reload();
  }
}
