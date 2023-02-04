import { GameLoader } from "../core/loader.js";
import { Register } from "../core/register.js";
import { map } from "../lib/number-utils.js";

export class SplashLoaderMixin extends GameLoader {
  states = {
    fadeToWhite: {
      length: 1000,
      next: "solid",
      onChange: () => {},
      alpha: (t) => map(t, 0, 1000, 0, 1),
      draw: true,
    },
    solid: {
      length: 500,
      next: "fadeToGame",
      onChange: () => this.launchGame(),
      alpha: () => 1,
      drawLogo: true,
    },
    fadeToGame: {
      length: 2000,
      next: "none",
      onChange: () => {},
      alpha: (t) => map(t, 0, 1000, 1, 0),
      drawLogo: false,
    },
  };
  currentState = this.states.fadeToWhite;
  timeInCurrentState = 0;

  end() {
    if (this.done) return;
    this.done = true;
    clearInterval(this.intervalId);
    Register.clearPreloadCache();
    const runner = this.runner;
    runner.game = this;
    runner.loop.start();
    this.timeInCurrentState = performance.now();
  }

  update() {
    const elapsed = performance.now() - this.timeInCurrentState;
    if (this.currentState.length < elapsed) {
      const prevState = this.currentState;
      prevState.onChange();

      if (prevState.next === "none") {
        this.runner.game = this.game;
        if (this.debugMode) this.runner.launchDebugger();
        return; // All done! Dismiss the preloader completely, set to actual game.
      }

      this.timeInCurrentState = performance.now();
      this.currentState = this.states[prevState.next];
    }

    const alpha = this.currentState.alpha(elapsed);
    if (this.currentState.draw) this.draw();

    const { ctx, realHeight, realWidth } = this.runner.system;

    ctx.fillStyle = "grey";
    ctx.fillRect(0, 0, realWidth, realHeight);

    // Draw the white rect over the whole screen
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, 0, realWidth, realHeight);
  }

  launchGame() {
    this.game = new this.gameClass({
      system: this.runner.system,
      fonts: this.runner.fonts,
      mediaFactory: this.runner.mediaFactory,
      ...this.runner.customGameOptions,
    });
  }

  draw() {
    const { ctx, realHeight, realWidth } = this.runner.system;

    ctx.font = "70px Arial";
    ctx.fillStyle = "purple";
    const textWidth = ctx.measureText("Dylan's Game Engine").width;
    ctx.fillText("Dylan's Game Engine", realWidth / 2 - textWidth / 2, realHeight / 2);
  }
}
