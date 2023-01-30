/** Helper class for validation. */
export class Guard {
  static #getKeyValue(keyValue) {
    if (!keyValue) throw new Error(`Non object passed: ${keyValue}`);
    const key = Object.keys(keyValue)[0];
    const value = keyValue[key];
    return { key, value };
  }

  /** Checks for correct instance types. Variables to validate must be passed wrapped in an object
   * i.e { valueToCheck }. */
  static isInstanceOf(keyValue, instanceOf) {
    const { key, value } = this.#getKeyValue(keyValue);
    if (!(value.prototype instanceof instanceOf))
      throw new Error(`${key} must be instance of ${instanceOf.name}.`);
  }

  /** Checks for null. Variables to validate must be passed wrapped in an object i.e { valueToCheck }. */
  static againstNull(keyValue) {
    const { key, value } = this.#getKeyValue(keyValue);
    if (value == null) throw new Error(`${key} is required.`);
    return {
      isInstanceOf: (other) => this.isInstanceOf(keyValue, other),
    };
  }
}
