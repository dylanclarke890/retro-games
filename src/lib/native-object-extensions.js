Number.prototype.constrain = function (min, max) {
  return Math.min(Math.max(this, min), max);
};

Number.prototype.map = function (istart, istop, ostart, ostop) {
  return ostart + (ostop - ostart) * ((this - istart) / (istop - istart));
};

Number.prototype.round = function (precision) {
  precision = Math.pow(10, precision || 0);
  return Math.round(this * precision) / precision;
};

Number.prototype.floor = function () {
  return Math.floor(this);
};

Number.prototype.ceil = function () {
  return Math.ceil(this);
};

Number.prototype.toInt = function () {
  return this | 0;
};

Number.prototype.toRad = function () {
  return (this / 180) * Math.PI;
};

Number.prototype.toDeg = function () {
  return (this * 180) / Math.PI;
};

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

export function loadScript({ src, cb = () => {} } = {}) {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.addEventListener("load", (e) => cb(e, src));
  script.src = src;
  document.body.appendChild(script);
}

export function JSONFormat(json) {
  const p = [];
  function push(m) {
    return "\\" + p.push(m) + "\\";
  }
  function pop(_m, i) {
    return p[i - 1];
  }
  function tabs(count) {
    return Array.from({ length: count + 1 }).join("\t");
  }
  let out = "",
    indent = 0;

  // Extract backslashes and strings
  json = json
    .replace(/\\./g, push)
    .replace(/(".*?"|'.*?')/g, push)
    .replace(/\s+/, "");

  // Indent and insert newlines
  for (let i = 0; i < json.length; i++) {
    const c = json.charAt(i);
    switch (c) {
      case "{":
      case "[":
        out += c + "\n" + tabs(++indent);
        break;
      case "}":
      case "]":
        out += "\n" + tabs(--indent) + c;
        break;
      case ",":
        out += ",\n" + tabs(indent);
        break;
      case ":":
        out += ": ";
        break;
      default:
        out += c;
        break;
    }
  }

  // Strip whitespace from numeric arrays and put backslashes
  // and strings back in
  out = out
    .replace(/\[[\d,\s]+?\]/g, function (m) {
      return m.replace(/\s/g, "");
    })
    .replace(/\\(\d+)\\/g, pop);

  return out;
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

Function.prototype.bind =
  Function.prototype.bind ||
  function (oThis) {
    if (typeof this !== "function")
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");

    let aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this;
    class fNOP {
      constructor() {}
    }
    class fBound {
      constructor() {
        return fToBind.apply(
          this instanceof fNOP && oThis ? this : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments))
        );
      }
    }

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };

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
