/**
 * @returns {HTMLElement}
 */
export function $el(selector) {
  if (selector instanceof HTMLElement) return selector;
  return document.querySelector(selector);
}

/**
 * @returns {HTMLElement}
 */
export function $new(tagname, opts = null) {
  return document.createElement(tagname, opts);
}

export function getInnerHeight(element) {
  const computed = getComputedStyle(element),
    padding = parseInt(computed.paddingTop) + parseInt(computed.paddingBottom);
  return element.clientHeight - padding;
}

export function getInnerWidth(element) {
  const computed = getComputedStyle(element),
    padding = parseInt(computed.paddingLeft) + parseInt(computed.paddingRight);
  return element.clientWidth - padding;
}

export function boolToOnOff(bool) {
  return bool ? "On" : "Off";
}

export function loadScript({ src, isES6Module, cb = () => {} } = {}) {
  if (isES6Module !== false) isES6Module = true;
  const script = document.createElement("script");
  script.type = isES6Module ? "module" : "text/javascript";
  script.addEventListener("load", (e) => cb(e, src));
  script.src = src;
  document.body.appendChild(script);
}

Object.defineProperty(Array.prototype, "erase", {
  value: function (item) {
    for (let i = this.length; i--; )
      if (this[i] === item) {
        this.splice(i, 1);
        break;
      }
    return this;
  },
});

Object.defineProperty(Array.prototype, "random", {
  value: function () {
    return this[Math.floor(Math.random() * this.length)];
  },
});

export class NativeExtensions {
  static extend(/** @type {Object} */ target, /** @type {Object[]} */ ...sources) {
    for (let source of sources)
      for (let sourceKey in source) {
        const srcValue = source[sourceKey];
        if (typeof srcValue !== "object" || srcValue instanceof HTMLElement || srcValue === null)
          target[sourceKey] = srcValue;
        else {
          if (!target[sourceKey] || typeof target[sourceKey] !== "object")
            target[sourceKey] = Array.isArray(srcValue) ? [] : {};
          NativeExtensions.extend(target[sourceKey], srcValue);
        }
      }
    return target;
  }

  static copy(object) {
    if (!object || typeof object !== "object" || object instanceof HTMLElement) return object;
    if (Array.isArray(object)) {
      const copied = [];
      for (let i = 0, l = object.length; i < l; i++) copied[i] = NativeExtensions.copy(object[i]);
      return copied;
    }
    const copied = {};
    for (let i in object) copied[i] = NativeExtensions.copy(object[i]);
    return copied;
  }

  static ksort(object) {
    if (!object || typeof object !== "object") return [];
    const keys = [],
      values = [];
    for (let i in object) keys.push(i);
    keys.sort();
    for (let i = 0; i < keys.length; i++) values.push(object[keys[i]]);
    return values;
  }

  static #chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  static uniqueId = () =>
    Array.from({ length: 10 }, () => this.#chars[Math.floor(Math.random() * 52)]).join("");
}
