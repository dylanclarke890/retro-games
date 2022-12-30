class GameRenderer {
  scale = 1;
  drawMode = this.DRAW.SMOOTH;
  scaleMode = this.SCALE.SMOOTH;

  constructor(scope) {
    this.scope = scope;
    this.scale = scope.constants.scale || 1;
  }

  static newRenderContext(w, h, scale = null) {
    const canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d"),
      ratio = scale || GameRenderer.getPixelRatio(ctx);

    // Set the canvas' width then downscale via CSS.
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    // Scale the context so we get accurate pixel density.
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // return the context (has back-reference to canvas) and the scale used.
    return [ctx, ratio];
  }

  /** Gets the proper pixel ratio by dividing the device ratio by the backing ratio. */
  static getPixelRatio(ctx) {
    const deviceRatio = devicePixelRatio;
    const backingRatio = VendorAttributes.get(ctx, "backingStorePixelRatio") || 1;
    return deviceRatio / backingRatio;
  }

  /** Normalizes getImageData to extract the real, actual pixels from an image. */
  getImagePixels(image, x, y, width, height) {
    const [ctx, _] = GameRenderer.newRenderContext(image.width, image.height, 1);
    const canvas = ctx.canvas;
    this.SCALE.CRISP(ctx); // Try to draw pixels as accurately as possible

    const ratio = GameRenderer.getPixelRatio(ctx);
    VendorAttributes.normalize(ctx, "getImageDataHD");

    const realWidth = image.width / ratio,
      realHeight = image.height / ratio;

    canvas.width = Math.ceil(realWidth);
    canvas.height = Math.ceil(realHeight);

    ctx.drawImage(image, 0, 0, realWidth, realHeight);

    return ratio === 1
      ? ctx.getImageData(x, y, width, height)
      : ctx.getImageDataHD(x, y, width, height);
  }

  render() {
    this.clear();

    const scope = this.scope;

    // Example text
    scope.ctx.font = "32px Arial";
    scope.ctx.fillStyle = "#fff";
    scope.ctx.fillText("It's dangerous to travel this route alone.", 5, 50);

    // Calling entity render methods
    if (scope.state["entities"] !== undefined)
      for (let entity in scope.state.entities) scope.state.entities[entity].render();
  }

  clear(color) {
    const { w, h } = this.scope.constants;
    if (color) {
      scope.ctx.fillStyle = "#fff";
      scope.ctx.fillRect(0, 0, w, h);
    } else this.scope.ctx.clearRect(0, 0, w, h);
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
      CRISP: function (ctx) {
        const canvas = ctx.canvas;
        VendorAttributes.set(ctx, "imageSmoothingEnabled", false);
        canvas.style.imageRendering = "-moz-crisp-edges";
        canvas.style.imageRendering = "-o-crisp-edges";
        canvas.style.imageRendering = "-webkit-optimize-contrast";
        canvas.style.imageRendering = "crisp-edges";
        canvas.style.msInterpolationMode = "nearest-neighbor"; // No effect on Canvas :/
      },
      SMOOTH: function (ctx) {
        const canvas = ctx.canvas;
        VendorAttributes.set(ctx, "imageSmoothingEnabled", true);
        canvas.style.imageRendering = "";
        canvas.style.msInterpolationMode = "";
      },
    };
  }
}
