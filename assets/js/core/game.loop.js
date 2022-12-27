function gameLoop(scope) {
  const loop = this;

  // Initialize timer variables so we can calculate FPS
  let fps = scope.constants.targetFps, // Our target fps
    fpsInterval = 1000 / fps, // the interval between animation ticks, in ms (1000 / 60 = ~16.666667)
    before = window.performance.now(), // The starting times timestamp
    // Set up an object to contain our alternating FPS calculations
    cycles = {
      new: {
        frameCount: 0, // Frames since the start of the cycle
        startTime: before, // The starting timestamp
        sinceStart: 0, // time elapsed since the startTime
      },
      old: {
        frameCount: 0,
        startTime: before,
        sinceStart: 0,
      },
    },
    // Alternating Frame Rate vars
    resetInterval = 5, // Frame rate cycle reset interval (in seconds)
    resetState = "new"; // The initial frame rate cycle

  loop.fps = 0; // A prop that will expose the current calculated FPS to other modules

  loop.main = function mainLoop(tframe) {
    /* setting to `stopLoop` so animation can be stopped via
       `window.cancelAnimationFrame( loop.stopLoop )` */
    loop.stopLoop = window.requestAnimationFrame(loop.main);

    let now = tframe,
      elapsed = now - before,
      activeCycle,
      targetResetInterval;

    if (elapsed > fpsInterval) {
      /* Set before = now for next frame, also adjust for
         specified fpsInterval not being a multiple of rAF's interval (16.7ms)
         ( http://stackoverflow.com/a/19772220 ) */
      before = now - (elapsed % fpsInterval);

      scope.update(now);
      scope.render();
    }
  };

  loop.main();

  return loop;
}
