import { Timer } from "../lib/timer.js";
import { Guard } from "../lib/guard.js";

export class EventChain {
  constructor() {
    this.chain = [];
    this.index = 0;
    this.isNextStep = true;
    this.timer = new Timer(0);
    this.stepMap = new Map();
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
    orUntil: (predicate) => {},
    every: (duration, action) => {},
    whilst: (action) => {},
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
      const stepKey = this.index;
      if (!this.stepMap.has(stepKey)) {
        this.stepMap.set(stepKey, { totalRepeats: amount, repeatsLeft: amount });
        // Reset the counters of any repeat steps before this one.
        for (const [key, { totalRepeats }] of this.stepMap.entries())
          if (totalRepeats != null && key < stepKey)
            this.stepMap.set(key, { totalRepeats, repeatsLeft: totalRepeats });
      }
      return () => {
        const { totalRepeats, repeatsLeft } = this.stepMap.get(stepKey);
        if (repeatsLeft <= 0) {
          this.nextStep();
          return;
        }
        console.log(`Do that again ${repeatsLeft} more times.`);
        this.stepMap.set(stepKey, { totalRepeats, repeatsLeft: repeatsLeft - 1 });
        this.reset();
      };
    },
  };

  createStep(action) {
    const step = { action, handler: null };
    this.chain.push(step);
  }

  nextStep() {
    this.index++;
    this.isNextStep = true;
  }

  reset() {
    this.index = -1;
    this.nextStep();
  }

  /**
   * Do not call this as part of your event chain. Should be used to
   * conditionally stop the event chain from continuing.
   */
  stop() {
    this.stopped = true;
  }

  wait(duration) {
    this.createStep(() => this.actions.wait(duration));
    return this;
  }

  orUntil(predicate) {
    Guard.isTypeOf({ predicate }, "function");
    console.log(`Or until ${predicate} is true.`);
    return this;
  }

  every(duration, action) {
    Guard.isTypeOf({ action }, "function");
    duration ??= 1;
    console.log(`Doing ${action} every ${duration} seconds.`);
    return this;
  }

  whilst(action) {
    Guard.isTypeOf({ action }, "function");
    this.createStep(() => this.actions.whilst(action));
    console.log(`Doing ${action} while waiting.`);
    return this;
  }

  waitUntil(predicate) {
    Guard.isTypeOf({ predicate }, "function");
    this.createStep(() => this.actions.waitUntil(predicate));
    return this;
  }

  then(action) {
    Guard.isTypeOf({ action }, "function");
    this.createStep(() => this.actions.then(action));
    return this;
  }

  thenUntil(predicate, action) {
    Guard.isTypeOf({ action }, "function");
    this.createStep(() => this.actions.thenUntil(predicate, action));
    return this;
  }

  repeat(amount) {
    amount ??= 1;
    this.createStep(() => this.actions.repeat(amount));
    return this;
  }

  update() {
    const link = this.chain[this.index];
    if (!link || this.stopped) return;
    if (this.isNextStep) {
      link.handler = link.action();
      this.isNextStep = false;
    }
    link.handler();
  }
}
