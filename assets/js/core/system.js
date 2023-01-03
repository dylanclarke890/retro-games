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

  imagesDrawn = 0;

  constructor({ runner, canvasId = null, width, height, scale }) {
    if (!runner) throw new Error("Runner is required.");
    this.#runner = runner;

    const [ctx, actualScale] = this.createRenderContext({
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
  }

  createRenderContext({ id, w, h, scale = null }) {
    id ??= "canvas"; // TODO - random ID generator.
    const canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d"),
      ratio = scale || this.getPixelRatio(ctx);

    // Set the canvas' width then downscale via CSS.
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.id = id;
    // Scale the context so we get accurate pixel density.
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // return the context (has back-reference to canvas) and the scale used.
    return [ctx, ratio];
  }

  getPixelRatio(ctx) {
    const deviceRatio = devicePixelRatio;
    const backingRatio = VendorAttributes.get(ctx, "backingStorePixelRatio") || 1;
    return deviceRatio / backingRatio;
  }

  get ready() {
    return this.#runner.ready;
  }

  addResource(resource) {
    this.#runner.addResource(resource);
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

  /** Normalizes getImageData to extract the real, actual pixels from an image. */
  getImagePixels(image, x, y, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");

    this.SCALE.CRISP(ctx); // Try to draw pixels as accurately as possible
    const ratio = this.getPixelRatio(ctx);

    const realWidth = image.width / ratio,
      realHeight = image.height / ratio;

    canvas.width = Math.ceil(realWidth);
    canvas.height = Math.ceil(realHeight);

    ctx.drawImage(image, 0, 0, realWidth, realWidth);

    return ctx.getImageData(x, y, width, height);
  }

  imageDrawn() {
    this.imagesDrawn++;
  }
}
