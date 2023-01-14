/** Helper class for validation. */
class Guard {
  static #getKeyValue(keyValue) {
    if (!keyValue) throw new Error(`Non object passed: ${keyValue}`);
    const key = Object.keys(keyValue)[0];
    const value = keyValue[key];
    return { key, value };
  }

  /** Checks for null. Variables to validate must be passed wrapped in an object i.e { valueToCheck }. */
  static againstNull(keyValue) {
    const { key, value } = this.#getKeyValue(keyValue);
    if (!value) throw new Error(`${key} is required.`);
    return {
      isInstanceOf: function (other) {
        if (!(value.prototype instanceof other))
          throw new Error(`${key} must be derived from ${other.name}`);
      },
    };
  }
}
