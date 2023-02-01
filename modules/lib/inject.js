export function injectClass(baseclass) {
  return new Injector({ baseclass });
}

export function injectInstance(instance) {
  return new Injector({ instance });
}

class Injector {
  constructor({ baseclass, instance }) {
    if (!baseclass && !instance)
      throw new Error(
        "Must pass either a class declaration via `injectClass()` or a class instance via injectInstance()"
      );
    this.baseclass = baseclass;
    this.instance = instance;
  }

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
   * injectClass(Example).with(overrides);
   *
   * // logs:
   * // Doing.
   * // Injector also doing.
   * new Example().do();
   */
  with(...overrides) {
    const proto = this.baseclass ? this.baseclass.prototype : Object.getPrototypeOf(this.instance);
    let tmpFnCache = {};
    for (let i = 0; i < overrides.length; i++) {
      const plugin = overrides[i];
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
