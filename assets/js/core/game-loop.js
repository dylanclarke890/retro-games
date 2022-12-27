class GameLoop {
  constructor(scope) {
    this.scope = scope;

    this.targetFps = scope.constants.targetFps;
    this.fpsInterval = 1000 / this.targetFps;

    this.loopStartedAt = now();
    this.uptime = -1;
    this.currentFrameStart = -1;
    this.lastFrameStart = -1;
    this.lastFrameEnd = -1;
    this.actualFps = -1;

    this.main();
  }

  #frameStart = (time) => {
    this.lastFrameStart = this.currentFrameStart;
    this.currentFrameStart = time;
    this.lastFrameEnd = time;
  };

  #getDeltaTime = () => this.lastFrameEnd - this.lastFrameStart;
  #getUptimeTime = () => now() - this.loopStartedAt;

  #getCurrentFps = () => Math.round(1000 / (this.lastFrameEnd - this.lastFrameStart));

  main(tframe) {
    this.#frameStart(tframe);
    this.stopLoop = raf((t) => this.main(t));
    const elapsed = this.#getDeltaTime();
    this.uptime = this.#getUptimeTime();

    if (elapsed < this.fpsInterval) return;

    this.actualFps = this.#getCurrentFps();
    this.scope.fps = this.actualFps;
    this.scope.state = this.scope.update(tframe);
    this.scope.render();
  }
}
