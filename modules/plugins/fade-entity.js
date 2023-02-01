import { Timer } from "../lib/timer.js";

export const FadeEntityMixin = (superclass) =>
  class extends superclass {
    constructor(opts) {
      super(opts);
      this.fadeInDuration ??= 0;
      this.fadeInTimer = new Timer(this.fadeInDuration);
      this.solidDuration ??= Infinity;
      this.solidTimerStarted = false;
      this.fadeOutDuration ??= 0;
      this.fadeOutTimerStarted = false;
    }

    draw() {
      const { ctx } = this.game.system;
      const originalAlpha = ctx.globalAlpha;
      ctx.globalAlpha = this.#fadeEntityAlpha();
      super.draw();
      ctx.globalAlpha = originalAlpha;
    }

    setFadeOut(duration) {
      if (this.solidDurationTimer) this.solidDurationTimer.set(0);
      else this.solidDurationTimer = new Timer(0);
      this.fadeOutTimer = new Timer(duration);
      this.fadeOutDuration = duration;
    }

    #startSolidTimer() {
      this.solidTimerStarted = true;
      if (!this.solidDurationTimer) this.solidDurationTimer = new Timer();
      this.solidDurationTimer.set(this.solidDuration);
    }

    #startFadeOutTimer() {
      this.fadeOutTimerStarted = true;
      if (!this.fadeOutTimer) this.fadeOutTimer = new Timer();
      this.fadeOutTimer.set(this.fadeOutDuration);
    }

    #fadeEntityAlpha() {
      if (this.fadeInTimer.delta() < 0)
        return 1 - Math.abs(this.fadeInTimer.delta() / this.fadeInDuration);
      else if (!this.solidTimerStarted) this.#startSolidTimer();

      if (this.solidDurationTimer.delta() < 0) return 1;
      else if (!this.fadeOutTimerStarted) this.#startFadeOutTimer();

      if (this.fadeOutTimer.delta() < 0)
        return Math.abs(this.fadeOutTimer.delta() / this.fadeOutDuration);

      if (this.loopFade) {
        this.fadeInTimer.set(this.fadeInDuration);
        this.solidTimerStarted = false;
        this.fadeOutTimerStarted = false;
        if (typeof this.loopFade === "number") this.loopFade--;
      }

      if (this.removeAfterFadeOut) this.kill();

      return 0;
    }
  };
