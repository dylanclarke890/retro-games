class GameLoop {
  constructor(scope) {
    // Set up an object to contain our alternating FPS calculations
    this.cycles = {
      new: {
        frameCount: 0,
        startTime: before,
        sinceStart: 0,
      },
      old: {
        frameCount: 0,
        startTime: before,
        sineStart: 0,
      },
    };
    // Alternating Frame Rate vars
    this.resetInterval = 5;
    this.resetState = "new";
    this.targetFps = scope.constants.targetFps;
    this.fpsInterval = 1000 / this.targetFps;
    this.actualFps = 0;
    this.before = performance.now();

    this.main();
  }

  main(tframe) {
    // setting to `stopLoop` so animation can be stopped via
    // `window.cancelAnimationFrame( loop.stopLoop )`
    this.stopLoop = requestAnimationFrame(this.main);

    // How long ago since last loop?
    const now = tframe,
      elapsed = now - before;

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
      const activeCycle = cycles[resetState];
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
        cycles[resetState].frameCount = 0;
        cycles[resetState].startTime = now;
        cycles[resetState].sinceStart = 0;

        this.resetState = this.resetState === "new" ? "old" : "new";
      }

      // Update the game state
      scope.state = scope.update(now);
      // Render the next frame
      scope.render();
    }
  }
}
