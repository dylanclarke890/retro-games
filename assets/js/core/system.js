class System {
  #runner = null;

  canvas = null;
  ctx = null;
  clock = null;
  tick = 0;
  scale = 1;
  drawPosition = this.DRAW.SMOOTH;
  realHeight = 800;
  realWidth = 600;
  scaleMode = this.SCALE.SMOOTH;
  height = 800;
  width = 600;

  constructor({ runner, canvasId = null, width, height, scale }) {
    Guard.againstNull({ runner });
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
}
