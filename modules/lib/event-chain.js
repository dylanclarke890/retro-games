import { Timer } from "./timer.js";
import { Guard } from "./guard.js";

export class EventChain {
  #chain;
  #index;
  #isNextLink;
  #linkMap;

  constructor() {
    this.#chain = [];
    this.#index = 0;
    this.#isNextLink = true;
    this.#linkMap = new Map();
  }

  #actions = {
    wait: (secs) => {
      const key = this.#index;
      this.#linkMap.get(key).timer.set(secs);

      return () => {
        const { timer, predicates, callbacks } = this.#linkMap.get(key);
        if (timer.delta() > 0 || predicates.some((check) => check())) {
          this.nextLink();
          return;
        }

        for (let i = 0; i < callbacks.length; i++) callbacks[i]();
      };
    },
    orUntil: (predicate) => {
      const waitLink = this.#linkMap.get(this.#chain.length - 1);
      if (!waitLink || !waitLink.isWaitLink)
        throw Error("Invalid event chain: orUntil must follow a wait link.");

      waitLink.predicates.push(predicate);
    },
    every: (duration, action) => {
      const waitLink = this.#linkMap.get(this.#chain.length - 1);
      if (!waitLink || !waitLink.isWaitLink)
        throw Error("Invalid event chain: every must follow a wait link.");

      const timer = new Timer(duration);
      waitLink.callbacks.push(() => {
        if (timer.delta() < 0) return;
        action();
        timer.set(duration);
      });
    },
    whilst: (action) => {
      const waitLink = this.#linkMap.get(this.#chain.length - 1);
      if (!waitLink || !waitLink.isWaitLink)
        throw Error("Invalid event chain: whilst must follow a wait link.");

      waitLink.callbacks.push(action);
    },
    waitUntil: (predicate) => {
      return () => {
        if (!predicate()) return;
        this.nextLink();
      };
    },
    then: (action) => {
      return () => {
        action();
        this.nextLink();
      };
    },
    thenUntil: (predicate, action) => {
      return () => {
        if (predicate()) {
          this.nextLink();
          return;
        }
        action();
      };
    },
    repeat: (amount) => {
      const stepKey = this.#index;
      if (!this.#linkMap.has(stepKey)) {
        this.#linkMap.set(stepKey, { totalRepeats: amount, repeatsLeft: amount });
        // Reset the counters of any repeat steps before this one.
        for (const [key, { totalRepeats }] of this.#linkMap.entries())
          if (totalRepeats != null && key < stepKey)
            this.#linkMap.set(key, { totalRepeats, repeatsLeft: totalRepeats });
      }
      return () => {
        const { totalRepeats, repeatsLeft } = this.#linkMap.get(stepKey);
        if (repeatsLeft <= 0) {
          this.nextLink();
          return;
        }
        this.#linkMap.set(stepKey, { totalRepeats, repeatsLeft: repeatsLeft - 1 });
        this.reset();
      };
    },
  };

  #createLink(action) {
    const link = { action, handler: null };
    this.#chain.push(link);
  }

  nextLink() {
    this.#index++;
    this.#isNextLink = true;
  }

  reset() {
    this.#index = -1;
    this.nextLink();
  }

  /**
   * Do not call this as part of your event chain. Should be used to
   * conditionally stop the event chain from continuing.
   */
  stop() {
    this.stopped = true;
  }

  wait(duration) {
    duration ??= 1;
    this.#linkMap.set(this.#chain.length, {
      timer: new Timer(),
      predicates: [],
      callbacks: [],
      isWaitLink: true,
    });
    this.#createLink(() => this.#actions.wait(duration));
    return this;
  }

  orUntil(predicate) {
    Guard.isTypeOf({ predicate }, "function");
    this.#actions.orUntil(predicate);
    return this;
  }

  every(duration, action) {
    Guard.isTypeOf({ action }, "function");
    duration ??= 1;
    this.#actions.every(duration, action);
    return this;
  }

  whilst(action) {
    Guard.isTypeOf({ action }, "function");
    this.#actions.whilst(action);
    return this;
  }

  waitUntil(predicate) {
    Guard.isTypeOf({ predicate }, "function");
    this.#createLink(() => this.#actions.waitUntil(predicate));
    return this;
  }

  then(action) {
    Guard.isTypeOf({ action }, "function");
    this.#createLink(() => this.#actions.then(action));
    return this;
  }

  thenUntil(predicate, action) {
    Guard.isTypeOf({ action }, "function");
    this.#createLink(() => this.#actions.thenUntil(predicate, action));
    return this;
  }

  repeat(amount) {
    amount ??= Infinity;
    this.#createLink(() => this.#actions.repeat(amount));
    return this;
  }

  update() {
    const link = this.#chain[this.#index];
    if (!link || this.stopped) return;
    if (this.#isNextLink) {
      link.handler = link.action();
      this.#isNextLink = false;
    }
    link.handler();
  }
}
