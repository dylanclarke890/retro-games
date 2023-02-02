import { Timer } from "../lib/timer.js";

export class EventChain {
  constructor() {
    this.chain = [];
    this.index = 0;
    this.isNextStep = true;
    this.timer = new Timer(0);
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
  };

  wait(duration) {
    this.chain.push({ action: () => this.actions.wait(duration) });
    return this;
  }

  waitUntil(predicate) {
    this.chain.push({ action: () => this.actions.waitUntil(predicate) });
    return this;
  }

  then(action) {
    this.chain.push({ action: () => this.actions.then(action) });
    return this;
  }

  thenUntil(predicate, action) {
    this.chain.push({ action: () => this.actions.thenUntil(predicate, action) });
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

  repeat(amount) {
    console.log(`Do that again ${amount} times.`);
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
