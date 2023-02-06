import { Input } from "../core/input.js";
import { Guard } from "../lib/guard.js";
import { plugin } from "../lib/inject.js";

export class CheatCodes {
  codes = {};

  static {
    plugin({
      name: "keydown",
      value: function (event) {
        CheatCodes.keydown(event);
        this.base(event);
      },
    }).to(Input);
  }

  static instances = [];
  static keysQueue = []; // keydown
  static queueMax = 0;
  static calcQueueMax() {
    CheatCodes.queueMax = 0;
    for (let i = 0; i < CheatCodes.instances.length; i++) {
      const cheatCodes = CheatCodes.instances[i];
      for (const name in cheatCodes.codes) {
        const code = cheatCodes.codes[name];
        if (CheatCodes.queueMax < code.keysLen) CheatCodes.queueMax = code.keysLen;
      }
    }
  }

  static keydown(event) {
    if (!CheatCodes.queueMax) return;

    if (event.type !== "keydown") return;
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    CheatCodes.keysQueue.push(event.keyCode);
    while (CheatCodes.keysQueue.length > CheatCodes.queueMax) CheatCodes.keysQueue.shift();
    for (let i = 0; i < CheatCodes.instances.length; i++) CheatCodes.instances[i].checkCodes();
  }

  constructor() {
    CheatCodes.instances.push(this);
  }

  addCode(name, keys, success, game) {
    Guard.againstNull({ name });
    Guard.againstNull({ game });
    if (!name || typeof keys !== "object" || typeof success !== "function") return;
    this.game = game;
    this.codes[name] = {
      keys: keys.join(),
      keysLen: keys.length,
      success: success,
    };

    CheatCodes.calcQueueMax();
  }

  removeCode(name) {
    delete this.codes[name];
    CheatCodes.calcQueueMax();
  }

  removeAllCodes() {
    this.codes = {};
    CheatCodes.calcQueueMax();
  }

  checkCodes() {
    for (const name in this.codes) {
      const code = this.codes[name];
      const begin = CheatCodes.queueMax - code.keysLen;
      if (CheatCodes.keysQueue.slice(begin).join() == code.keys) code.success.apply(this.game);
    }
  }
}
