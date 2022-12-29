/** Binds a number between a minimum and a maximum amount. */
Number.prototype.boundary = function (min, max) {
  return Math.min(Math.max(this, min), max);
};
