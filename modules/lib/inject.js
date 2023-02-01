/**
 * Apply a series of mixins to a class. Applies mixins one at a time so take care
 * that subsequent mixins do not override.
 * @example
 * class Example {
 *   do() {
 *     console.log("Doing.");
 *   }
 * }
 *
 * const overrides = {
 *  do() {
 *    this.parent();
 *    console.log("Injector also doing.");
 *  }
 * }
 *
 * plug(overrides).into(Example);
 *
 * // logs:
 * // Doing.
 * // Injector also doing.
 * new Example().do();
 */
export function plug(...overrides) {
  return new Injector(...overrides);
}

class Injector {
  constructor(...overrides) {
    this.overrides = overrides;
  }

  /**
   * @param {*} obj class declaration or instance to apply overrides to.
   */
  into(obj) {
    const proto = obj.prototype ?? Object.getPrototypeOf(obj);
    const tmpFnCache = {};
    for (let i = 0; i < this.overrides.length; i++) {
      const plugin = this.overrides[i];
      for (let name in plugin) {
        if (typeof plugin[name] !== "function" || typeof proto[name] !== "function") {
          proto[name] = plugin[name];
          continue;
        }

        tmpFnCache[name] = proto[name];
        proto[name] = (function (name, fn) {
          return function () {
            const tmp = this.parent;
            this.parent = tmpFnCache[name];

            const ret = fn.apply(this, arguments);
            this.parent = tmp;

            return ret;
          };
        })(name, plugin[name]);
      }
    }
  }
}
