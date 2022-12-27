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

  /** @type {number} */
  #lastFrame;

  /** @type {boolean} */
  #stopped;

  constructor(opts = {}) {
    Object.assign(this, defaults, opts);
    this.#fpsInterval = 1000 / this.fps;
    this.#stopped = false;
    this.#lastFrame = 0;
    this.frameNumber = 0;
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
    this.#lastFrame = performance.now();
    this.#animationLoop(0);
  }

  #animationLoop(currentTime) {
    if (this.#stopped) return;

    requestAnimationFrame((t) => this.#animationLoop(t));
    const elapsed = currentTime - this.#lastFrame;
    if (elapsed > this.#fpsInterval) {
      this.#lastFrame = currentTime - (elapsed % this.#fpsInterval);
      this.frameNumber++;
      this.update();
    }
  }

  update() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = "black";
    this.ctx.font = "Arial 20px";
    this.ctx.fillText(this.frameNumber, 200, 100);
  }

  stop() {
    this.#stopped = true;
  }
}

const game = new RetroGame();
game.start();
