import { Timer } from "./timer.js";
import { Guard } from "./guard.js";

export class EventChain {
  #chain;
  #maxChain;
  #currentChain;
  #index;
  #isNextLink;
  #linkMap;

  static #mustFollowWaitLink(name) {
    throw new TypeError(`Invalid event chain: '${name}' must follow a 'wait' link.`);
  }

  /**
   * @param {Object} options
   * @param {number?} options.maxChain If set, will chain events immediately up until maxChain. Default is 25.
   */
  constructor({ maxChain } = {}) {
    this.#maxChain = maxChain == null ? 25 : maxChain;
    this.#chain = [];
    this.#index = 0;
    this.#isNextLink = true;
    this.#linkMap = new Map();
  }

  #actions = {
    wait: (duration) => {
      const key = this.#index;
      this.#linkMap.get(key).timer.set(duration);
      return () => {
        const { timer, predicates, callbacks } = this.#linkMap.get(key);
        if (timer.delta() > 0 || predicates.some((check) => check())) {
          this.#nextLink();
          return;
        }
        for (let i = 0; i < callbacks.length; i++) callbacks[i]();
      };
    },
    waitUntil: (predicate) => {
      const key = this.#index;
      this.#linkMap.get(key).predicates.push(predicate);
      return () => {
        const { predicates, callbacks } = this.#linkMap.get(key);
        if (predicates.some((check) => check())) {
          this.#nextLink();
          return;
        }
        for (let i = 0; i < callbacks.length; i++) callbacks[i]();
      };
    },
    orUntil: (predicate) => {
      const waitLink = this.#linkMap.get(this.#chain.length - 1);
      if (!waitLink?.isWaitLink) EventChain.#mustFollowWaitLink("orUntil");
      waitLink.predicates.push(predicate);
    },
    every: (duration, action) => {
      const waitLink = this.#linkMap.get(this.#chain.length - 1);
      if (!waitLink?.isWaitLink) EventChain.#mustFollowWaitLink("every");
      const timer = new Timer(duration);
      waitLink.callbacks.push(() => {
        if (timer.delta() < 0) return;
        action();
        timer.set(duration);
      });
    },
    whilst: (action) => {
      const waitLink = this.#linkMap.get(this.#chain.length - 1);
      if (!waitLink?.isWaitLink) EventChain.#mustFollowWaitLink("whilst");
      waitLink.callbacks.push(action);
    },
    then: (action) => {
      return () => {
        action();
        this.#nextLink();
      };
    },
    thenUntil: (predicate, action) => {
      return () => {
        if (predicate()) {
          this.#nextLink();
          return;
        }
        action();
      };
    },
    repeat: (amount) => {
      const stepKey = this.#index;
      if (!this.#linkMap.has(stepKey)) {
        this.#linkMap.set(stepKey, { totalRepeats: amount, repeatsLeft: amount });
        this.#resetRepeatLinks(stepKey);
      }
      return () => {
        const { totalRepeats, repeatsLeft } = this.#linkMap.get(stepKey);
        if (repeatsLeft <= 0) {
          this.#nextLink();
          return;
        }
        this.#linkMap.set(stepKey, { totalRepeats, repeatsLeft: repeatsLeft - 1 });
        this.reset();
      };
    },
    repeatUntil: (predicate) => {
      const stepKey = this.#index;
      if (!this.#linkMap.has(stepKey)) {
        this.#linkMap.set(stepKey, { predicate });
        this.#resetRepeatLinks(stepKey);
      }
      return () => {
        const { predicate } = this.#linkMap.get(stepKey);
        if (predicate()) {
          this.#nextLink();
          return;
        }
        this.reset();
      };
    },
  };

  #createLink(action) {
    const link = { action, handler: null };
    this.#chain.push(link);
  }

  #nextLink() {
    this.#index++;
    this.#isNextLink = true;
  }

  /** Reset the counters of any repeat links before this one. */
  #resetRepeatLinks(currentStep) {
    for (const [key, { totalRepeats }] of this.#linkMap.entries())
      if (totalRepeats != null && key < currentStep)
        this.#linkMap.set(key, { totalRepeats, repeatsLeft: totalRepeats });
      else break;
  }

  /**
   * Immediately sets the event chain back to it's first link. Execution of the event chain will then
   * continue as normal. */
  reset() {
    this.#index = -1;
    this.#nextLink();
  }

  /**
   * Warning: don't call this as part of your event chain. Should be used to
   * conditionally stop the event chain from continuing.
   */
  stop() {
    this.stopped = true;
  }

  /**
   * Wait a period of time before continuing to the next link in the event chain.
   * Can be extended with 'orUntil', 'every' and 'whilst' links.
   * @param {number} duration Amount of time to wait in seconds.
   */
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

  /**
   * Wait until a predicate returns true before continuing to the next link in the event chain.
   * Can be extended with 'orUntil', 'every' and 'whilst' links.
   * @param {() => boolean} predicate
   */
  waitUntil(predicate) {
    Guard.isTypeOf({ predicate }, "function");
    this.#linkMap.set(this.#chain.length, {
      predicates: [],
      callbacks: [],
      isWaitLink: true,
    });
    this.#createLink(() => this.#actions.waitUntil(predicate));
    return this;
  }

  /**
   * Breaks out of the previous 'wait' link and proceeds to the next link in the event chain
   * if a predicate returns true. Throws an error if the previous link in the event chain is not
   * 'wait', 'waitUntil' or another link type that can follow 'wait'.
   * @param {() => boolean} predicate
   */
  orUntil(predicate) {
    Guard.isTypeOf({ predicate }, "function");
    this.#actions.orUntil(predicate);
    return this;
  }

  /**
   * Performs an action at regular intervals until the previous 'wait' link
   * has completed. Throws an error if the previous link in the event chain is not 'wait' or another link
   * type that can follow 'wait'.
   * @param {number} duration Function to invoke at set interval.
   * @param {() => void} action Function to invoke at set interval.
   * @throws {TypeError}
   */
  every(duration, action) {
    Guard.isTypeOf({ action }, "function");
    duration ??= 1;
    this.#actions.every(duration, action);
    return this;
  }

  /**
   * Perform an action every frame while waiting for the previous 'wait' link to complete.
   * Throws an error if the previous link in the event chain is not 'wait' or another link
   * type that can follow 'wait'.
   * @param {() => void} action
   */
  whilst(action) {
    Guard.isTypeOf({ action }, "function");
    this.#actions.whilst(action);
    return this;
  }

  /**
   * Perform an action immediately after the previous link in the event chain.
   * @param {() => void} action
   */
  then(action) {
    Guard.isTypeOf({ action }, "function");
    this.#createLink(() => this.#actions.then(action));
    return this;
  }

  /**
   * Perform an action every frame until a predicate returns true.
   * @param {() => boolean} predicate
   * @param {() => void} action
   */
  thenUntil(predicate, action) {
    Guard.isTypeOf({ action }, "function");
    this.#createLink(() => this.#actions.thenUntil(predicate, action));
    return this;
  }

  /**
   * Repeat the previous links in the event chain. ALL links are repeated, including
   * any prior 'repeat' links.
   * @param {number} amount Amount of times to repeat the link. Defaults to Infinity.
   */
  repeat(amount) {
    amount ??= Infinity;
    this.#createLink(() => this.#actions.repeat(amount));
    return this;
  }

  /**
   * Repeat the previous links in the event chain until predicate returns true. ALL links are repeated, including
   * any prior 'repeat' links.
   * @param {() => boolean)} predicate
   */
  repeatUntil(predicate) {
    this.#createLink(() => this.#actions.repeatUntil(predicate));
    return this;
  }

  /**
   * Call as part of your game's update loop. Invokes the current link's handler until completion, then moves
   * onto the next link in the event chain on the next frame.
   */
  update() {
    const link = this.#chain[this.#index];
    if (!link || this.stopped) return;
    if (this.#isNextLink) {
      link.handler = link.action();
      this.#isNextLink = false;
    }
    link.handler();

    if (!this.#maxChain || !this.#isNextLink) return;
    this.#currentChain = 0;
    while (this.#isNextLink && this.#currentChain < this.#maxChain) {
      this.update();
      this.#currentChain++;
      if (this.#currentChain === this.#maxChain)
        console.debug("EventChain: Exceeded max chain count.");
    }
  }
}
