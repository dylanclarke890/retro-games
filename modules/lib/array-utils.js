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
