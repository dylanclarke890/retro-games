class AssetToPreload {
  path = "";
  type = "";
  data = null;

  constructor({ path, type }) {
    this.path = path;
    this.type = type;
  }

  load(loadCallback) {
    switch (this.type) {
      case "image":
        this.data = new Image();
        break;
      case "sound":
        this.data = new Audio();
        break;
      default:
        throw new Error(`Couldn't determine type of: ${type}.`);
    }
    this.data.onload = () => loadCallback(this.path, true);
    this.data.onerror = () => loadCallback(this.path, false);
    this.data.src = this.path;
  }
}

class Register {
  // TODO: Use sets instead of arrays.
  static #cache = {
    classDefinitions: {},
    preload: {
      image: [],
      sound: [],
    },
  };

  static entityType(classDefinition) {
    Guard.againstNull({ classDefinition });
    const store = this.#cache.classDefinitions;
    store[classDefinition.name] = classDefinition;
  }

  static entityTypes(...classDefinitions) {
    classDefinitions.forEach((cd) => Register.entityType(cd));
  }

  static getEntityByType(className) {
    if (typeof className !== "string") return className;
    return this.#cache.classDefinitions[className];
  }

  static preloadImage(imgOrPath) {
    Register.preloadAsset(imgOrPath, "image");
  }

  static preloadImages(...imgOrPaths) {
    imgOrPaths.forEach((i) => Register.preloadImage(i));
  }

  static preloadSound(soundOrPath) {
    Register.preloadAsset(soundOrPath, "sound");
  }

  static preloadSounds(...soundsOrPaths) {
    soundsOrPaths.forEach((i) => Register.preloadSound(i));
  }

  static preloadAsset(asset, type = "image") {
    if (typeof asset === "string") asset = new AssetToPreload({ path: asset, type });
    const store = this.#cache.preload[type];
    store.push(asset);
  }

  static getAssetsToPreload() {
    const allAssets = [];
    const preload = this.#cache.preload;
    allAssets.concat(preload.image);
    allAssets.concat(preload.sound);
    return allAssets;
  }

  static clearPreloadCache() {
    this.#cache.preload = {
      image: [],
      sound: [],
    };
  }
}
