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
function $el(selector) {
  return document.querySelector(selector);
}

/**
 * @returns {HTMLElement}
 */
function $new(tagname, opts = null) {
  return document.createElement(tagname, opts);
}

function boolToOnOff(bool) {
  return bool ? "On" : "Off";
}

function dragElement(el) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  const header = $el(`#${el.id}header`);
  if (header) header.onmousedown = dragMouseDown;
  else el.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    el.style.top = el.offsetTop - pos2 + "px";
    el.style.left = el.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
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

class NativeExtensions {
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
