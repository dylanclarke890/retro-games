export class GameLoop {
  #clock = null;
  #lastFrame = -1;
  #rafId = -1;
  #runner = null;
  #stats = null;
  #stopped = false;
  #targetFps = 60;
  #fpsInterval = 1000 / 60;

  constructor({ runner, targetFps }) {
    Guard.againstNull({ runner });
    this.#clock = new Timer();
    this.#runner = runner;
    this.#lastFrame = -1;
    this.#targetFps = targetFps ?? 60;
    this.#fpsInterval = 1000 / this.#targetFps;

    const stopBtn = $el("#game-stop");
    if (stopBtn) stopBtn.addEventListener("click", () => this.stop());
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
