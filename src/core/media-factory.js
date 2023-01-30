import { Guard } from "../lib/guard.js";
import { Register } from "./register.js";
import { Font } from "./font.js";
import { Sound } from "./sound.js";
import { GameAnimationSheet } from "./animation.js";
import { GameImage } from "./image.js";

export class MediaFactory {
  #system = null;
  #soundManager = null;

  constructor({ system, soundManager } = {}) {
    Guard.againstNull({ system });
    Guard.againstNull({ soundManager });
    this.#system = system;
    this.#soundManager = soundManager;
  }

  #createAsset(path, data, type) {
    /* Animations end up calling the factory again to create the image anyway,
     * may as well just cache that instead as the image class can be more generically used. */
    if (type !== "animation") {
      const cached = Register.getCachedAsset(path);
      if (cached) return cached;
    }

    let asset;
    switch (type) {
      case "font":
        asset = new Font({ path, system: this.#system, ...data });
        break;
      case "sound":
        asset = new Sound({ path, soundManager: this.#soundManager, ...data });
        break;
      case "animation":
        asset = new GameAnimationSheet({ path, system: this.#system, ...data });
        break;
      case "image":
        asset = new GameImage({ path, system: this.#system, ...data });
        break;
      default:
        throw new Error(`Couldn't determine asset type of ${type}`);
    }
    // We don't want to overwrite a cached image with an animation.
    if (type !== "animation") Register.cacheAsset(path, asset);
    return asset;
  }

  createFont({ path, name } = {}) {
    return this.#createAsset(path, { name }, "font");
  }

  createAnimationSheet({ path, size }) {
    return this.#createAsset(path, { size, mediaFactory: this }, "animation");
  }

  createSound({ path, multiChannel = false }) {
    return this.#createAsset(path, { multiChannel }, "sound");
  }

  createImage({ path, ...data }) {
    return this.#createAsset(path, data, "image");
  }
}
