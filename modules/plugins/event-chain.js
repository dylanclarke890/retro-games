export class EventChain {
  static actions = {
    wait: (time) => {
      let decrement = time;
      console.log(decrement);
    },
  };

  constructor(opts) {
    this.steps ??= [];
    opts ??= {};
    Object.assign(this, opts);
  }

  wait(duration) {
    console.log(duration);
    return this;
  }

  waitUntil(predicate) {
    console.log(predicate);
    return this;
  }

  orUntil(predicate) {
    console.log(predicate);
    return this;
  }

  waitForAnimation(animation, times) {
    console.log(animation, times);
    return this;
  }

  every(duration, action) {
    console.log(duration, action);
    return this;
  }

  during(action) {
    console.log(action);
    return this;
  }

  then(action) {
    console.log(action);
    return this;
  }

  thenUntil(predicate, action) {
    console.log(predicate, action);
    return this;
  }

  repeat(times) {
    console.log(times);
    return this;
  }

  reset() {}

  update() {
    if (!this.stepsCopy || !this.stepsCopy.length) this.stepsCopy = this.steps.slice(0);
    if (this.steps && this.steps.length) this.steps[0]();
  }
}

EventChain.mixin("during", function (context, steps) {
  return function (doThis) {
    if (!steps) throw new Error("during only works with previous step!");
    const func = steps[steps.length - 1];
    steps[steps.length - 1] = function () {
      doThis.call(context);
      func();
    };
    return this;
  };
});

EventChain.mixin("orUntil", function (context, steps) {
  return function (predicate) {
    if (!steps) throw new Error("orUntil only works with previous step!");
    const func = steps[steps.length - 1];
    steps[steps.length - 1] = function () {
      if (predicate.call(context)) {
        steps.shift();
        return;
      }
      func();
    };
    return this;
  };
});

EventChain.mixin("waitForAnimation", function (context, steps) {
  return function (animation, times) {
    // If we were not given an animation, then look in context for a currentAnim property.
    if (!times) {
      times = 1;
      if (typeof animation === "number") {
        times = animation;
        animation = context.currentAnim;
      }
      if (animation == null) animation = context.currentAnim;
    }
    steps.push(function () {
      if (animation.loopCount >= times) steps.shift();
    });
    return this;
  };
});
