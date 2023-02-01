import { Timer } from "../lib/timer.js";

export const FadeEntityMixin = (superclass) =>
  class extends superclass {
    constructor(opts) {
      super(opts);
      this.fadeInDuration ??= 0;
      this.solidDuration ??= Infinity;
      this.fadeOutDuration ??= 0;
      this.fadeInTimer = new Timer(this.fadeInDuration);
    }

    draw() {
      const { ctx } = this.game.system;
      const originalAlpha = ctx.globalAlpha;
      ctx.globalAlpha = this.fadeInEntity_getAlpha();
      super.draw();
      ctx.globalAlpha = originalAlpha;
    }

    setFadeOut(duration) {
      if (this.solidDurationTimer) this.solidDurationTimer.set(0);
      else this.solidDurationTimer = new Timer(0);
      this.fadeOutTimer = new Timer(duration);
      this.fadeOutDuration = duration;
    }

    fadeInEntity_getAlpha() {
      if (this.fadeInTimer.delta() < 0) {
        return 1 - Math.abs(this.fadeInTimer.delta() / this.fadeInDuration);
      } else if (!this.solidDurationTimer) this.solidDurationTimer = new Timer(this.solidDuration);

      if (this.solidDurationTimer.delta() < 0) return 1;
      else if (!this.fadeOutTimer) this.fadeOutTimer = new Timer(this.fadeOutDuration);

      if (this.fadeOutTimer.delta() < 0)
        return Math.abs(this.fadeOutTimer.delta() / this.fadeOutDuration);

      if (this.loopFade) {
        this.fadeInTimer.set(this.fadeInDuration);
        this.solidDurationTimer = null;
        this.fadeOutTimer = null;
        if (typeof this.loopFade === "number") this.loopFade--;
      }

      if (this.killAfterFadeOut) this.kill();

      return 0;
    }
  };
