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
  // TODO: Use sets instead of arrays.
  static #cache = {
    classDefinitions: {},
    preload: {
      image: [],
      sound: [],
      font: [],
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

  static preloadFont(fontFaceOrPath) {
    Register.preloadAsset(fontFaceOrPath, "font");
  }

  static preloadFonts(...fontFacesOrPaths) {
    fontFacesOrPaths.forEach((i) => Register.preloadFont(i));
  }

  static preloadAsset(asset, type = "image") {
    if (typeof asset === "string") asset = new AssetToPreload({ path: asset, type });
    const store = this.#cache.preload[type];
    store.push(asset);
  }

  static getAssetsToPreload() {
    const preload = this.#cache.preload;
    const allAssets = Object.keys(preload).reduce((a, b) => {
      if (typeof a === "string") return preload[a].concat(preload[b]);
      else return a.concat(preload[b]);
    });
    return allAssets;
  }

  static clearPreloadCache() {
    this.#cache.preload = {
      image: [],
      sound: [],
      font: [],
    };
  }
}
