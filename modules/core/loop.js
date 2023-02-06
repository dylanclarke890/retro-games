import { $el } from "../lib/dom-utils.js";
import { Guard } from "../lib/guard.js";
import { Timer } from "../lib/timer.js";

export class GameLoop {
  clock;
  runner;
  rafId;
  stopped;

  #lastFrame;
  targetFps;
  #fpsInterval;

  constructor({ runner, targetFps }) {
    Guard.againstNull({ runner });
    this.clock = new Timer();
    this.runner = runner;
    this.#lastFrame = -1;
    this.targetFps = targetFps ?? 60;
    this.#fpsInterval = 1000 / this.targetFps;

    const stopBtn = $el("#game-stop");
    if (stopBtn) stopBtn.addEventListener("click", () => this.stop());
  }

  start() {
    this.main(performance.now());
  }

  main(timestamp) {
    if (this.stopped) return cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame((t) => this.main(t));

    Timer.step();
    this.runner.system.tick = this.clock.tick();

    const elapsed = timestamp - this.#lastFrame;
    if (elapsed < this.#fpsInterval) return;
    this.#lastFrame = timestamp - (elapsed % this.#fpsInterval);

    this.runner.game.update();
    this.runner.game.draw();
  }

  stop() {
    this.stopped = true;
  }
}
