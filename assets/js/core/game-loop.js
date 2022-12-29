class GameLoop {
  constructor(scope) {
    this.scope = scope;

    // FPS properties
    this.targetFps = scope.constants.targetFps;
    this.fpsInterval = 1000 / this.targetFps;
    this.lastFrame = -1;

    if (this.scope.constants.showDebugStats) {
      const viewport = this.scope.viewport;
      const statsPositionX = viewport.offsetLeft + viewport.offsetWidth - Stats.containerWidth;
      const statsPositionY = viewport.offsetTop + viewport.offsetHeight - Stats.containerHeight;
      this.stats = new Stats({
        appendTo: document.body,
        domElementStyles: {
          position: "absolute",
          left: statsPositionX + "px",
          top: statsPositionY + "px",
        },
      });
    }
    this.rafId = -1;
    this.stopped = false;
  }

  start() {
    this.main(now());
  }

  main(timestamp) {
    if (this.stopped) return caf(this.rafId);
    this.rafId = raf((t) => this.main(t));

    const elapsed = timestamp - this.lastFrame;
    if (elapsed < this.fpsInterval) return;
    this.lastFrame = timestamp - (elapsed % this.fpsInterval);

    this.scope.state = this.scope.updater.update(timestamp);
    this.scope.renderer.render();
    if (this.scope.constants.showDebugStats) this.stats.update();
  }

  stop() {
    this.stopped = true;
  }
}
