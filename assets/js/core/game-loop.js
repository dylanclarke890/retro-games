class GameLoop {
  #rafId = -1;
  #lastFrame = -1;
  #stopped = false;

  constructor({ runner, targetFps, showDebugStats }) {
    Guard.againstNull({ runner });
    this.runner = runner;
    this.showDebugStats = showDebugStats;
    this.clock = new Timer();

    // FPS properties
    this.targetFps = targetFps ?? 60;
    this.fpsInterval = 1000 / this.targetFps;
    this.lastFrame = -1;

    if (showDebugStats) {
      // position stats in bottom right corner.
      const width = 96;
      const height = 48;
      const { offsetLeft, offsetTop, offsetHeight, offsetWidth } = this.runner.system.canvas;
      const statsPositionX = offsetLeft + offsetWidth - width;
      const statsPositionY = offsetTop + offsetHeight - height;
      this.stats = new Stats({
        containerElementStyles: {
          position: "absolute",
          left: statsPositionX + "px",
          top: statsPositionY + "px",
        },
        height,
        target: document.body,
        width,
      });
    }
  }

  start() {
    this.main(performance.now());
  }

  main(timestamp) {
    if (this.#stopped) return caf(this.#rafId);
    this.#rafId = raf((t) => this.main(t));
    Timer.step();
    this.runner.system.tick = this.clock.tick();

    const elapsed = timestamp - this.#lastFrame;
    if (elapsed < this.fpsInterval) return;
    this.#lastFrame = timestamp - (elapsed % this.fpsInterval);

    this.runner.game.update();
    this.runner.game.draw();
    if (this.showDebugStats) this.stats.update();
  }

  stop() {
    this.#stopped = true;
  }
}
