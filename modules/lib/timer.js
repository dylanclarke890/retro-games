export class Timer {
  static #last = 0;

  static maxStep = 0.05;
  static time = Number.MIN_VALUE;
  static timeScale = 1;

  base = 0;
  last = 0;
  pausedAt = 0;
  target = 0;

  static step() {
    const current = performance.now();
    const delta = (current - Timer.#last) / 1000;
    Timer.time += Math.min(delta, Timer.maxStep) * Timer.timeScale;
    Timer.#last = current;
  }

  constructor(seconds) {
    this.base = Timer.time;
    this.last = Timer.time;
    this.target = seconds || 0;
  }

  set(seconds) {
    this.target = seconds || 0;
    this.reset();
  }

  reset() {
    this.base = Timer.time;
    this.pausedAt = 0;
  }

  tick() {
    if (this.pausedAt) return 0;
    const delta = Timer.time - this.last;
    this.last = Timer.time;
    return delta;
  }

  delta() {
    return (this.pausedAt || Timer.time) - this.base - this.target;
  }

  pause() {
    if (this.pausedAt) return;
    this.pausedAt = Timer.time;
  }

  unpause() {
    if (!this.pausedAt) return;
    this.base += Timer.time - this.pausedAt;
    this.pausedAt = 0;
  }
}
