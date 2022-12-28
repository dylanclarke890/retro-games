class GameLoop {
  constructor(scope) {
    this.scope = scope;

    this.targetFps = scope.constants.targetFps;
    this.fpsInterval = 1000 / this.targetFps;

    this.uptime = -1;
    this.currentFrameStart = -1;
    this.lastFrameStart = -1;
    this.lastFrameEnd = -1;
    this.actualFps = -1;
    this.fpsTracker = new AverageFPSTracker();

    this.rafId = -1;
    this.stopped = false;
  }

  #frameStart = (time) => {
    this.lastFrameStart = this.currentFrameStart;
    this.currentFrameStart = time;
    this.lastFrameEnd = time;
  };

  #getDeltaTime = () => this.lastFrameEnd - this.lastFrameStart;
  #getUptimeTime = () => now() - this.loopStartedAt;

  #getCurrentFps = () => Math.round(1000 / (this.lastFrameEnd - this.lastFrameStart));

  start() {
    const currentTime = now();
    this.main(currentTime);
    this.loopStartedAt = currentTime;
  }

  main(timestamp) {
    if (this.stopped) return caf(this.rafId);
    this.#frameStart(timestamp);
    this.rafId = raf((t) => this.main(t));

    this.uptime = this.#getUptimeTime();
    const elapsed = this.#getDeltaTime();
    if (elapsed < this.fpsInterval) return; // this line is currently causing skipped frames.

    this.fpsTracker.push(this.#getCurrentFps());
    this.scope.fps = this.fpsTracker.averageFps;
    this.scope.state = this.scope.updater.update(timestamp);
    this.scope.renderer.render();
  }

  stop() {
    this.stopped = true;
  }
}
