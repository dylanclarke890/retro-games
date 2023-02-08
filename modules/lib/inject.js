/**
 * Apply a series of overrides/plugins to a class. Applies plugins one at a time so take care
 * that subsequent plugins do not override. Overrides have access to the original method by calling this.base().
 * @example
 * class Example {
 *   do() {
 *     console.example("Doing.");
 *   }
 * }
 *
 * const exampleOverrides = [
 *   {
 *     name: "do",
 *     value: function () {
 *       this.base();
 *       console.example("Plugin also doing");
 *     },
 *     isStatic: false,
 *   },
 * ];
 *
 * plugin(exampleOverrides).to(Example);
 *
 * // logs:
 * // Doing.
 * // Plugin also doing.
 * new Example().do();
 */
export function plugin(...plugins) {
  return new Injector(...plugins);
}

class Injector {
  #overrides;
  constructor(...overrides) {
    this.#overrides = overrides;
  }

  #applyPlugin(plugin, obj) {
    const proto = obj.prototype ?? Object.getPrototypeOf(obj);
    const construct = proto.constructor;
    const tmpFnCache = {};
    for (let i = 0; i < plugin.length; i++) {
      const { name, value, isStatic, overrideBase } = plugin[i];
      const target = isStatic ? construct : proto;

      if (overrideBase || typeof value !== "function" || typeof target[name] !== "function") {
        target[name] = value;
        continue;
      }

      /* If we get this far both objects have a method with the same name 
         and we need access to the original method on the target object. */
      tmpFnCache[name] = target[name];
      target[name] = (function (name, fn) {
        return function () {
          const tmp = this.base;
          this.base = tmpFnCache[name];
          const ret = fn.apply(this, arguments);
          this.base = tmp;
          return ret;
        };
      })(name, value);
    }
  }

  /**
   * @param {*} obj class declaration or instance to apply overrides to.
   */
  to(obj) {
    for (let i = 0; i < this.#overrides.length; i++) this.#applyPlugin(this.#overrides[i], obj);
  }
}
