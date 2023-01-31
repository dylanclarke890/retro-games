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
 * inject(Example).with(overrides);
 *
 * // logs:
 * // Doing.
 * // Injector also doing.
 * new Example().do();
 */
export function inject(baseclass) {
  return new Injector(baseclass);
}

class Injector {
  constructor(baseclass) {
    this.baseclass = baseclass;
  }

  with(overrides) {
    const proto = this.baseclass.prototype;
    const tmpFnCache = {};
    for (let name in overrides) {
      if (typeof overrides[name] !== "function" || typeof proto[name] !== "function") {
        proto[name] = overrides[name];
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
      })(name, overrides[name]);
    }
  }
}
