class System {
  constructor({ canvasId = null }) {
    this.canvasId = canvasId ?? 1; // TODO: random id generator.
    this.canvas = document.createElement("canvas");
  }
}
