class AssetToPreload {
  path = "";

  constructor({ path }) {
    this.path = path;
  }

  load(loadCallback) {
    this.data = new Image();
    this.data.onload = () => loadCallback(this.path, true);
    this.data.onerror = () => loadCallback(this.path, false);
    this.data.src = this.path;
  }
}

class Register {
  static #scopes = {
    classDefinitions: "globalClasses",
    assetsToPreload: "assets",
  };
  static #cache = {};

  static entityType(classDefinition) {
    const key = this.#scopes.classDefinitions;
    this.#cache[key] = this.#cache[key] || {};
    this.#cache[key][classDefinition.name] = classDefinition;
  }

  static entityTypes(...classDefinitions) {
    classDefinitions.forEach((cd) => Register.entityType(cd));
  }

  static getEntityByType(className) {
    if (typeof className !== "string") return className;
    const key = this.#scopes.classDefinitions;
    return (this.#cache[key] || {})[className];
  }

  static preloadAsset(asset) {
    if (typeof asset === "string") asset = new AssetToPreload({ path: asset });
    const key = this.#scopes.assetsToPreload;
    this.#cache[key] = this.#cache[key] || [];
    this.#cache[key].push(asset);
  }

  static preloadAssets(...assets) {
    assets.forEach((a) => Register.preloadAsset(a));
  }

  static getAssetsToPreload() {
    const key = this.#scopes.assetsToPreload;
    return this.#cache[key] || [];
  }

  static clearPreloadCache() {
    const key = this.#scopes.assetsToPreload;
    delete this.#cache[key];
  }
}
