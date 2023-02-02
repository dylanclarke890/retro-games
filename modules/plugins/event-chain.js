import { Timer } from "../lib/timer.js";

export class EventChain {
  constructor() {
    this.chain = [];
    this.index = 0;
    this.isNextStep = true;
    this.timer = new Timer(0);
  }

  createStep(action) {
    const step = { action, handler: null };
    this.chain.push(step);
  }

  nextStep() {
    this.index++;
    this.isNextStep = true;
  }

  actions = {
    wait: (secs) => {
      this.timer.set(secs);
      console.log(`Waiting ${secs} seconds.`);
      return () => {
        if (this.timer.delta() < 0) return;
        this.nextStep();
      };
    },
    waitUntil: (predicate) => {
      console.log(`Waiting until ${predicate} is true.`);
      return () => {
        if (!predicate()) return false;
        this.nextStep();
        return true;
      };
    },
    then: (action) => {
      console.log(`Then doing ${action}.`);
      return () => {
        action();
        this.nextStep();
      };
    },
    thenUntil: (predicate, action) => {
      console.log(`Then doing ${action} until ${predicate} is true.`);
      return () => {
        if (predicate()) {
          this.nextStep();
          return true;
        }
        action();
        return false;
      };
    },
    repeat: (amount) => {
      amount ??= 1;
      this.repeatMap ??= new Map();
      const repeatKey = this.index;

      if (!this.repeatMap.has(repeatKey)) {
        this.repeatMap.set(repeatKey, { original: amount, current: amount });
        // Reset the counters of any repeat steps before this one.
        for (const [key, { original }] of this.repeatMap.entries())
          if (key < repeatKey) this.repeatMap.set(key, { original, current: original });
      }
      return () => {
        const timesLeft = this.repeatMap.get(repeatKey);
        if (timesLeft.current <= 0) {
          this.nextStep();
          return;
        }
        console.log(`Do that again ${timesLeft.current} more times.`);

        timesLeft.current--;
        this.repeatMap.set(repeatKey, timesLeft);
        this.index = -1; // nextStep() will set back to 0.
        this.nextStep();
      };
    },
  };

  wait(duration) {
    this.createStep(() => this.actions.wait(duration));
    return this;
  }

  waitUntil(predicate) {
    this.createStep(() => this.actions.waitUntil(predicate));
    return this;
  }

  then(action) {
    this.createStep(() => this.actions.then(action));
    return this;
  }

  thenUntil(predicate, action) {
    this.createStep(() => this.actions.thenUntil(predicate, action));
    return this;
  }

  repeat(amount) {
    this.createStep(() => this.actions.repeat(amount));
    return this;
  }

  orUntil(predicate) {
    console.log(`Or until ${predicate} is true.`);
    return this;
  }

  every(duration, action) {
    console.log(`Doing ${action} every ${duration} seconds.`);
    return this;
  }

  during(action) {
    console.log(`Doing ${action} at the same time.`);
    return this;
  }

  reset() {}

  update() {
    const link = this.chain[this.index];
    if (!link) return;
    if (this.isNextStep) {
      link.handler = link.action();
      this.isNextStep = false;
    }
    link.handler();
  }
}
