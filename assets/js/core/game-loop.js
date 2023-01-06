class GameLoop {
  #clock = null;
  #lastFrame = -1;
  #rafId = -1;
  #runner = null;
  #stats = null;
  #stopped = false;
  #targetFps = 60;
  #fpsInterval = 1000 / 60;

  constructor({ runner, targetFps, showDebugStats }) {
    Guard.againstNull({ runner });
    this.#runner = runner;
    this.#clock = new Timer();

    // FPS properties
    this.#targetFps = targetFps ?? 60;
    this.#fpsInterval = 1000 / this.#targetFps;
    this.#lastFrame = -1;

    if (showDebugStats) {
      // position stats in bottom right corner.
      const width = 96;
      const height = 48;
      const { offsetLeft, offsetTop, offsetHeight, offsetWidth } = this.#runner.system.canvas;
      const statsPositionX = offsetLeft + offsetWidth - width;
      const statsPositionY = offsetTop + offsetHeight - height;
      this.#stats = new Stats({
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
    this.#runner.system.tick = this.#clock.tick();

    const elapsed = timestamp - this.#lastFrame;
    if (elapsed < this.#fpsInterval) return;
    this.#lastFrame = timestamp - (elapsed % this.#fpsInterval);

    this.#runner.game.update();
    this.#runner.game.draw();
    if (this.#stats) this.#stats.update();
  }

  stop() {
    this.#stopped = true;
  }
}
