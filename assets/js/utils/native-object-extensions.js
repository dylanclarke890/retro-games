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
