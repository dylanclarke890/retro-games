class GameLoop {
  constructor(scope) {
    this.scope = scope;
    // Alternating Frame Rate vars
    this.resetInterval = 5;
    this.resetState = "new";
    this.targetFps = scope.constants.targetFps;
    this.fpsInterval = 1000 / this.targetFps;
    this.actualFps = 0;
    this.before = now();
    // Set up an object to contain our alternating FPS calculations
    this.cycles = {
      new: {
        frameCount: 0,
        startTime: this.before,
        sinceStart: 0,
      },
      old: {
        frameCount: 0,
        startTime: this.before,
        sinceStart: 0,
      },
    };

    this.loopStartedAt = now();
    this.currentFrameStart = -1;
    this.lastFrameStart = -1;
    this.lastFrameEnd = -1;

    this.main();
  }

  #frameStart = (time) => {
    this.lastFrameStart = this.currentFrameStart;
    this.currentFrameStart = time;
    this.lastFrameEnd = time;
  };

  #getDeltaTime = () => this.lastFrameEnd - this.lastFrameStart;

  main(tframe) {
    this.#frameStart(tframe);
    this.stopLoop = raf((t) => this.main(t));

    const now = tframe,
      elapsed = this.#getDeltaTime();
    // If it's been at least our desired interval, render
    if (elapsed > this.fpsInterval) {
      // Set before = now for next frame, also adjust for
      // specified fpsInterval not being a multiple of rAF's interval (16.7ms)
      // ( http://stackoverflow.com/a/19772220 )
      this.before = now - (elapsed % this.fpsInterval);

      // Increment the vals for both the active and the alternate FPS calculations
      const cycles = this.cycles;
      for (let calc in cycles) {
        ++cycles[calc].frameCount;
        cycles[calc].sinceStart = now - cycles[calc].startTime;
      }

      // Choose the correct FPS calculation, then update the exposed fps value
      const activeCycle = cycles[this.resetState];
      this.actualFps =
        Math.round((1000 / (activeCycle.sinceStart / activeCycle.frameCount)) * 100) / 100;

      // If our frame counts are equal....
      const targetResetInterval =
        cycles.new.frameCount === cycles.old.frameCount
          ? this.resetInterval * this.targetFps // Wait our interval
          : this.resetInterval * 2 * this.targetFps; // Wait double our interval

      // If the active calculation goes over our specified interval,
      // reset it to 0 and flag our alternate calculation to be active
      // for the next series of animations.
      if (activeCycle.frameCount > targetResetInterval) {
        cycles[this.resetState].frameCount = 0;
        cycles[this.resetState].startTime = now;
        cycles[this.resetState].sinceStart = 0;

        this.resetState = this.resetState === "new" ? "old" : "new";
      }
      this.scope.fps = this.actualFps;
      // Update the game state
      this.scope.state = this.scope.update(now);
      // Render the next frame
      this.scope.render();
    }
  }
}
