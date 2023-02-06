import { Guard } from "../lib/guard.js";
import { Register } from "./register.js";
import { Font } from "./font.js";
import { Sound } from "./sound.js";
import { GameAnimationSheet } from "./animation.js";
import { GameImage } from "./image.js";

export class MediaFactory {
  #system = null;
  #soundManager = null;

  /**
   * Array of asset types to exclude from caching.
   * @type {string[]}
   */
  static noCache = [
    /* Animations end up calling the factory again to create the image anyway,
     * may as well just cache that instead as the image can be more generically used. */
    "animation",
  ];

  constructor({ system, soundManager } = {}) {
    Guard.againstNull({ system });
    Guard.againstNull({ soundManager });
    this.#system = system;
    this.#soundManager = soundManager;
  }

  #createAsset(path, data, type) {
    if (!MediaFactory.noCache.includes(type)) {
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

    if (!MediaFactory.noCache.includes(type)) Register.cacheAsset(path, asset);
    return asset;
  }

  /**
   * @returns {Font} 
   */
  createFont({ path, name } = {}) {
    return this.#createAsset(path, { name }, "font");
  }

  /**
   * @returns {GameAnimationSheet} 
   */
  createAnimationSheet({ path, size }) {
    return this.#createAsset(path, { size, mediaFactory: this }, "animation");
  }

  /**
   * @returns {Sound}
   */
  createSound({ path, multiChannel = false }) {
    return this.#createAsset(path, { multiChannel }, "sound");
  }

  /**
   * @returns {GameImage}
   */
  createImage({ path, ...data }) {
    return this.#createAsset(path, data, "image");
  }
}
