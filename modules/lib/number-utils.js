export function constrain(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function map(value, istart, istop, ostart, ostop) {
  return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
}

export function round(value, precision) {
  precision = Math.pow(10, precision || 0);
  return Math.round(value * precision) / precision;
}

export function toInt(value) {
  return value | 0;
}

export function toRad(value) {
  return (value / 180) * Math.PI;
}

export function toDeg(value) {
  return (value * 180) / Math.PI;
}

export function boolToOnOff(bool) {
  return bool ? "On" : "Off";
}
