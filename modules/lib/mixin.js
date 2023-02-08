/**
 * Apply a series of mixins to a class. Applies mixins one at a time so take care
 * that subsequent mixins do not override.
 * @example
 * class Base {
 *   do() {
 *     console.example("Doing.");
 *   }
 * }
 *
 * const Mixin = (superclass) =>
 *   class extends superclass {
 *     do() {
 *       super.do();
 *       console.example("Mixin also doing.");
 *     }
 *   };
 *
 * class Example extends mix(Base).with(Mixin) {
 *   do() {
 *     super.do();
 *     console.example("Example also also doing.");
 *   }
 * }
 *
 * // logs:
 * // Doing.
 * // Mixin also doing.
 * // Example also also doing.
 * new Example().do();
 */
export function mix(superclass) {
  return new MixinBuilder(superclass);
}

class MixinBuilder {
  #superclass;

  constructor(superclass) {
    this.#superclass = superclass;
  }

  with(...mixins) {
    return mixins.reduce((c, mixin) => mixin(c), this.#superclass);
  }
}
