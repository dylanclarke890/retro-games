const defaults = {
  fps: 60,
  canvas: {
    id: "play-area",
    width: 500,
    height: 500,
  },
};

class RetroGame {
  /** @type {number} */
  #fpsInterval;

  /** @type {boolean} */
  #stopped;

  constructor(opts = {}) {
    Object.assign(this, defaults, opts);
    this.#fpsInterval = 1000 / this.fps;
    this.#stopped = false;
    this.lastFrame = 0;
    this.#setupCanvas();
  }

  #setupCanvas() {
    const { id, width, height } = this.canvas;
    const canvas = document.getElementById(id);
    if (!canvas) {
      canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
    }
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext("2d");
  }

  start() {
    this.lastFrame = performance.now();
    this.#animationLoop(0);
  }

  #animationLoop(currentTime) {
    if (this.#stopped) return;

    requestAnimationFrame((t) => this.#animationLoop(t));
    const elapsed = currentTime - this.lastFrame;
    if (elapsed > this.#fpsInterval) {
      this.lastFrame = currentTime - (elapsed % this.#fpsInterval);
      // update();
    }
  }

  stop() {
    this.#stopped = true;
  }
}

const game = new RetroGame();
game.start();
