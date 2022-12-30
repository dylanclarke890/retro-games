class Timer {
  target = 0;
  base = 0;
  last = 0;
  pausedAt = 0;
  #last = 0;
  timeScale = 1;
  maxStep = 0.05;
  time = Number.MIN_VALUE;

  constructor(seconds) {
    this.base = this.time;
    this.last = this.time;
    this.target = seconds || 0;
  }

  set(seconds) {
    this.target = seconds || 0;
    this.base = this.time;
    this.pausedAt = 0;
  }

  reset() {
    this.base = this.time;
    this.pausedAt = 0;
  }

  tick() {
    const delta = this.time - this.last;
    this.last = this.time;
    return this.pausedAt ? 0 : delta;
  }

  delta() {
    return (this.pausedAt || this.time) - this.base - this.target;
  }

  pause() {
    if (!this.pausedAt) this.pausedAt = this.time;
  }

  unpause() {
    if (!this.pausedAt) return;
    this.base += this.time - this.pausedAt;
    this.pausedAt = 0;
  }

  step() {
    const current = performance.now();
    const delta = (current - this.#last) / 1000;
    this.time += Math.min(delta, this.maxStep) * this.timeScale;
    this.#last = current;
  }
}
