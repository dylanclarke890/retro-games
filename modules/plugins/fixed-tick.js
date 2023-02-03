import { Guard } from "../lib/guard.js";
import { Timer } from "../lib/timer.js";

export const systemOverrides = {
  _delta: 0, // accumulates time for scheduling game updates
  _lastRun: 0, // timestamp run() was last called
  tickRate: 60,

  startRunLoop: function () {
    this.base();

    // forget about any time that elapsed while the run loop was stopped
    this._lastRun = performance.now();
  },

  run: function () {
    const timestamp = performance.now();

    // Track the accumulated time that hasn't been simulated yet
    this._delta += timestamp - this._lastRun;
    this._lastRun = timestamp;

    // Simulate the total elapsed time in fixed-size chunks
    let count = 0;
    const timestep = 1000 / this.tickRate;
    while (this._delta >= timestep) {
      if (++count >= 240) throw new Error("FixedTick: something went wrong.");

      Timer.step();
      this.tick = this.clock.tick();
      this._delta -= timestep;
      this.input.clearPressed();
      this.delegate.update();
    }

    this.delegate.draw();

    if (this.newGameClass) {
      this.setGameNow(this.newGameClass);
      this.newGameClass = null;
    }
  },

  setDelegate: function (object) {
    Guard.isTypeOf({ update: object.update }, "function");
    Guard.isTypeOf({ draw: object.draw }, "function");

    this.delegate = object;
    this.startRunLoop();
  },
};

export const timerOverrides = {
  tick: function () {
    var ms = 1000 / this.system.tickRate;
    var seconds = ms / 1000;
    var delta = seconds * Timer.timeScale;
    return this.pausedAt ? 0 : delta;
  },
  step: function () {
    var ms = 1000 / this.system.tickRate;
    var seconds = ms / 1000;
    Timer.time += seconds * Timer.timeScale;
  },
};
