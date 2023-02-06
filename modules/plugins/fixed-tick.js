import { Timer } from "../lib/timer.js";

export const FixedTickPlugin = {
  loop: [
    { name: "_delta", value: 0 },
    { name: "_lastRun", value: 0 },
    {
      name: "start",
      value: function () {
        this.base();
        // forget about any time that elapsed while the run loop was stopped
        this._lastRun = performance.now();
      },
    },
    {
      name: "main",
      value: function (timestamp) {
        if (this.stopped) return cancelAnimationFrame(this.rafId);

        this.rafId = requestAnimationFrame((t) => this.main(t));
        // Track the accumulated time that hasn't been simulated yet
        this._delta += timestamp - this._lastRun;
        this._lastRun = timestamp;
        const game = this.runner.game;

        // Simulate the total elapsed time in fixed-size chunks
        let count = 0;
        const timestep = 1000 / Timer.tickRate;
        while (this._delta >= timestep) {
          // Sanity check
          if (++count >= 240) throw new Error("Error from fixed rate plugin.");

          Timer.step();
          this.runner.system.tick = this.clock.tick();

          game.update();
          game.input.clearPressed();

          this._delta -= timestep;
        }
        game.draw();
      },
    },
  ],
  timer: [
    {
      name: "tick",
      value: function () {
        if (this.pausedAt) return 0;
        const ms = 1000 / Timer.tickRate;
        const seconds = ms / 1000;
        const delta = seconds * Timer.timeScale;
        return delta;
      },
    },
    {
      name: "step",
      value: function () {
        const ms = 1000 / this.tickRate;
        const seconds = ms / 1000;
        this.time += seconds * this.timeScale;
      },
      isStatic: true,
    },
    { name: "tickRate", value: 60, isStatic: true },
  ],
};
