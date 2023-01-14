/**
 * To be used when the asset passed to MediaFactory.create-* is just a path to the resource, instead of one of the various
 * media classes that are used for them (GameImage etc). Will call the relevant load logic for each media type.
 */
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
      case "font":
        const fontFace = new FontFace(NativeExtensions.uniqueId(), `url(${this.path})`);
        document.fonts.add(fontFace);
        this.data = fontFace;
        this.data.load().then(
          () => loadCallback(path, true),
          () => loadCallback(path, false)
        );
        break;
      case "image":
        this.data = new Image();
        this.data.onload = () => {
          loadCallback(this.path, true);
        };
        this.data.onerror = () => {
          loadCallback(this.path, false);
        };
        this.data.src = this.path;
        break;
      case "sound":
        this.data = new Audio(this.path);
        this.data.oncanplaythrough = () => {
          this.data.oncanplaythrough = null;
          loadCallback(this.path, true);
        };
        this.data.onerror = () => loadCallback(this.path, false);
        break;
      default:
        throw new Error(`Unable to determine type of asset to preload: ${this.type}`);
    }
  }
}

class Register {
  static #assetCache = {};

  static #preloadCache = {
    classDefinitions: {},
    assets: {
      image: new Set(),
      sound: new Set(),
      font: new Set(),
    },
  };

  static entityType(classDefinition) {
    Guard.againstNull({ classDefinition });
    const store = this.#preloadCache.classDefinitions;
    store[classDefinition.name] = classDefinition;
  }

  static entityTypes(...classDefinitions) {
    classDefinitions.forEach((cd) => Register.entityType(cd));
  }

  static getEntityByType(className) {
    if (typeof className !== "string") return className;
    return this.#preloadCache.classDefinitions[className];
  }

  static preloadImage(imgOrPath) {
    Guard.againstNull({ imgOrPath });
    Register.preloadAsset(imgOrPath, "image");
  }

  static preloadImages(...imgOrPaths) {
    imgOrPaths.forEach((i) => Register.preloadImage(i));
  }

  static preloadSound(soundOrPath) {
    Guard.againstNull({ soundOrPath });
    Register.preloadAsset(soundOrPath, "sound");
  }

  static preloadSounds(...soundsOrPaths) {
    soundsOrPaths.forEach((i) => Register.preloadSound(i));
  }

  static preloadFont(fontFaceOrPath) {
    Guard.againstNull({ fontFaceOrPath });
    Register.preloadAsset(fontFaceOrPath, "font");
  }

  static preloadFonts(...fontFacesOrPaths) {
    fontFacesOrPaths.forEach((i) => Register.preloadFont(i));
  }

  static preloadAsset(asset, type = "image") {
    if (typeof asset === "string") asset = new AssetToPreload({ path: asset, type });
    const store = this.#preloadCache.assets[type];
    store.add(asset);
  }

  static getAssetsToPreload() {
    const preload = this.#preloadCache.assets;
    const allAssets = new Set([...preload.font, ...preload.image, ...preload.sound]);
    return [...allAssets.values()];
  }

  static clearPreloadCache() {
    this.#preloadCache.assets = {
      image: new Set(),
      sound: new Set(),
      font: new Set(),
    };
  }

  static cacheAsset(path, asset) {
    this.#assetCache[path] = asset;
  }

  static getCachedAsset(path) {
    return this.#assetCache[path];
  }
}
