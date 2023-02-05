import { removeItem } from "../lib/array-utils.js";
import { Guard } from "../lib/guard.js";
import { Register } from "./register.js";

export class GameLoader {
  #assetsToPreload = [];
  #progressPercent = 0;
  #unloaded = [];

  status = 0;
  debugMode = false;
  done = false;
  gameClass = null;
  intervalId = 0;
  runner = null;

  constructor({ runner, gameClass, debugMode }) {
    Guard.againstNull({ runner });
    Guard.againstNull({ gameClass });

    this.runner = runner;
    this.gameClass = gameClass;
    this.debugMode = debugMode;
    this.#assetsToPreload = Register.getAssetsToPreload();
    for (let i = 0; i < this.#assetsToPreload.length; i++)
      this.#unloaded.push(this.#assetsToPreload[i].path);
  }

  load() {
    this.runner.system.clear("#000");
    if (!this.#assetsToPreload.length) {
      this.end();
      return;
    }
    for (let i = 0; i < this.#assetsToPreload.length; i++)
      this.#assetsToPreload[i].load((path, success) => this.#loadCallback(path, success));
    this.intervalId = setInterval(() => this.#drawLoadingScreen(), 16);
  }

  end() {
    if (this.done) return;
    this.done = true;
    clearInterval(this.intervalId);
    this.runner.setGame(this.gameClass);
    Register.clearPreloadCache();
    if (this.debugMode) this.runner.launchDebugger();
  }

  #drawLoadingScreen() {
    this.#progressPercent += (this.status - this.#progressPercent) / 5;
    const { scale, width, height, ctx } = this.runner.system;
    let barWidth = Math.floor(width * 0.6);
    let barHeight = Math.floor(height * 0.1);
    const x = Math.floor(width * 0.5 - barWidth / 2) * scale;
    const y = Math.floor(height * 0.5 - barHeight / 2) * scale;
    barWidth = barWidth * scale;
    barHeight = barHeight * scale;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "#000";
    ctx.fillRect(x + scale, y + scale, barWidth - scale - scale, barHeight - scale - scale);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, barWidth * this.#progressPercent, barHeight);
  }

  #loadCallback(path, wasSuccessful) {
    if (!wasSuccessful) throw new Error(`Failed to load resource: ${path}`);
    removeItem(this.#unloaded, path);
    this.status = 1 - this.#unloaded.length / this.#assetsToPreload.length;
    if (this.#unloaded.length === 0) setTimeout(() => this.end(), 250);
  }
}
