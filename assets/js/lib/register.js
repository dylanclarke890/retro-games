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

  static getEntityType(className) {
    const key = this.#scopes.classDefinitions;
    return (this.#cache[key] || {})[className];
  }

  static preloadAsset(asset) {
    const key = this.#scopes.assetsToPreload;
    this.#cache[key] = this.#cache[key] || [];
    this.#cache[key].push(asset);
  }

  static preloadAssets(...assets) {
    assets.forEach((a) => Register.preloadAsset(a));
  }

  static getAssetsToPreload() {
    const key = this.#scopes.classDefinitions;
    return this.#cache[key] || [];
  }
}
