/** Binds a number between a minimum and a maximum amount. */
Number.prototype.boundary = function (min, max) {
  return Math.min(Math.max(this, min), max);
};

class AverageFPSTracker {
  // 50 seems to be the min needed to get an accurate number.
  constructor(maxEntriesAtOneTime = 100) {
    this.entries = [];
    this.maxEntries = maxEntriesAtOneTime;
  }

  push(fps) {
    if (this.entries.length === this.maxEntries) this.pop();
    this.entries.push(fps);
    console.log(
      "🚀 ~ file: maths.js:17 ~ AverageFPSTracker ~ push ~ this.entries.length",
      this.entries.length
    );
  }
  pop() {
    return this.entries.pop();
  }

  get averageFps() {
    return Math.round(this.entries.reduce((a, b) => a + b, 0) / this.entries.length);
  }
}
