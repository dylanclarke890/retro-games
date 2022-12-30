class GameRenderer {
  scale = 1; // TODO!
  drawMode = this.DRAW.SMOOTH;
  scaleMode = this.SCALE.SMOOTH;

  constructor(scope) {
    this.scope = scope;
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
        // TODO: setVendorAttribute(ctx, "imageSmoothingEnabled", false);
        canvas.style.imageRendering = "-moz-crisp-edges";
        canvas.style.imageRendering = "-o-crisp-edges";
        canvas.style.imageRendering = "-webkit-optimize-contrast";
        canvas.style.imageRendering = "crisp-edges";
        canvas.style.msInterpolationMode = "nearest-neighbor"; // No effect on Canvas :/
      },
      SMOOTH: function (ctx) {
        const canvas = ctx.canvas;
        // TODO: setVendorAttribute(ctx, "imageSmoothingEnabled", true);
        canvas.style.imageRendering = "";
        canvas.style.msInterpolationMode = "";
      },
    };
  }
}
