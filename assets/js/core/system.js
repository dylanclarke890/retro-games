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

    this.canvas = document.getElementById(canvasId) ?? document.createElement("canvas");
    this.canvas.id = canvasId ?? NativeExtensions.uniqueId();
    this.resize(width, height, scale);
    this.ctx = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.firstChild);
    this.width = width;
    this.height = height;
  }

  getPixelRatio(ctx) {
    const deviceRatio = devicePixelRatio;
    const backingRatio = VendorAttributes.get(ctx, "backingStorePixelRatio") || 1;
    return deviceRatio / backingRatio;
  }

  resize(width, height, scale) {
    this.width = width;
    this.height = height;
    this.scale = scale || this.scale;

    this.realWidth = this.width * this.scale;
    this.realHeight = this.height * this.scale;
    this.canvas.width = this.realWidth;
    this.canvas.height = this.realHeight;
  }

  get ready() {
    return this.#runner.ready;
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
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
    } else ctx.clearRect(0, 0, width, height);
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

    const realWidth = image.width / this.scale,
      realHeight = image.height / this.scale;

    canvas.width = Math.ceil(realWidth);
    canvas.height = Math.ceil(realHeight);

    ctx.drawImage(image, 0, 0, realWidth, realWidth);

    return ctx.getImageData(x, y, width, height);
  }

  imageDrawn() {
    this.imagesDrawn++;
  }
}
