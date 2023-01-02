class System {
  fps = 60;
  width = 600;
  height = 800;
  realWidth = 600;
  realHeight = 800;
  scale = 1;
  drawPosition = this.DRAW.SMOOTH;
  scaleMode = this.SCALE.SMOOTH;

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

  clear(color) {
    const { ctx, width, height } = this;
    if (color) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }

  get DRAW() {
    return {
      AUTHENTIC: (p) => Math.round(p) * this.scale,
      SMOOTH: (p) => Math.round(p * this.scale),
      SUBPIXEL: (p) => p * this.scale,
    };
  }

  get SCALE() {
    return {
      CRISP: (ctx) => {
        const canvas = ctx.canvas;
        VendorAttributes.set(ctx, "imageSmoothingEnabled", false);
        canvas.style.imageRendering = "-moz-crisp-edges";
        canvas.style.imageRendering = "-o-crisp-edges";
        canvas.style.imageRendering = "-webkit-optimize-contrast";
        canvas.style.imageRendering = "crisp-edges";
        canvas.style.msInterpolationMode = "nearest-neighbor"; // No effect on Canvas :/
      },
      SMOOTH: (ctx) => {
        const canvas = ctx.canvas;
        VendorAttributes.set(ctx, "imageSmoothingEnabled", true);
        canvas.style.imageRendering = "";
        canvas.style.msInterpolationMode = "";
      },
    };
  }
}
