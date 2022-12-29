class GameLoop {
  #rafId = -1;
  #lastFrame = -1;
  #stopped = false;

  constructor(scope) {
    this.scope = scope;

    // FPS properties
    this.targetFps = scope.constants.targetFps;
    this.fpsInterval = 1000 / this.targetFps;
    this.lastFrame = -1;

    if (this.scope.constants.showDebugStats) {
      const { offsetLeft, offsetTop, offsetHeight, offsetWidth } = this.scope.viewport;
      const statsPositionX = offsetLeft + offsetWidth - Stats.containerWidth;
      const statsPositionY = offsetTop + offsetHeight - Stats.containerHeight;
      this.stats = new Stats({
        target: document.body,
        containerElementStyles: {
          position: "absolute",
          left: statsPositionX + "px",
          top: statsPositionY + "px",
        },
      });
    }
  }

  start() {
    this.main(now());
  }

  main(timestamp) {
    if (this.#stopped) return caf(this.#rafId);
    this.#rafId = raf((t) => this.main(t));

    const elapsed = timestamp - this.#lastFrame;
    if (elapsed < this.fpsInterval) return;
    this.#lastFrame = timestamp - (elapsed % this.fpsInterval);

    this.scope.state = this.scope.updater.update(timestamp);
    this.scope.renderer.render();
    if (this.scope.constants.showDebugStats) this.stats.update();
  }

  stop() {
    this.#stopped = true;
  }
}
