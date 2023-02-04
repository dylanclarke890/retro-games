export function removeItem(array, item) {
  for (let i = array.length; i >= 0; i--) {
    if (array[i] === item) {
      array.splice(i, 1);
      break;
    }
  }
  return array;
}

export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle an array.
 * @param {Array} array
 */
export function shuffle(array) {
  const copy = array.slice();
  let iCurrent = copy.length;

  // While there are elements to shuffle.
  while (iCurrent) {
    const iSwap = Math.floor(Math.random() * iCurrent--); // Pick a remaining element.
    const tmp = array[iCurrent]; // And swap it with the current element.
    copy[iCurrent] = copy[iSwap];
    copy[iSwap] = tmp;
  }

  return array;
}
