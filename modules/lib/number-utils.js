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

export function randomNumber(upTo, floor = true) {
  const rand = Math.random() * upTo;
  return floor ? Math.floor(rand) : rand;
}

/**
 * Generate a random number between min and max (min and max included).
*/ 
export function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function boolToOnOff(bool) {
  return bool ? "On" : "Off";
}
