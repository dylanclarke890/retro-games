import { Timer } from "../lib/timer.js";

export class EventChain {
  constructor() {
    this.chain = [];
    this.chainCopy = [];
    this.currentStep = 0;
    this.isNextStep = true;
    this.timer = new Timer(0);
  }

  createStep(action) {
    const step = { action, handler: null };
    this.chain.push(step);
    this.chainCopy.push(step);
  }

  nextStep() {
    this.currentStep++;
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
      console.log(`Do that again ${amount} times.`);
      return () => {
        // Add all the previous steps excluding the current one (to avoid endless repeats) to the chain.
        for (let i = 0; i < amount; i++)
          this.chain.push(...this.chainCopy.slice(0, this.currentStep - 1));
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
    const link = this.chain[this.currentStep];
    if (!link) return;
    if (this.isNextStep) {
      link.handler = link.action();
      this.isNextStep = false;
    }
    link.handler();
  }
}
