export function removeItem(array, item) {
  for (let i = array.length; i > 0; i--)
    if (array[i] === item) {
      array.splice(i, 1);
      break;
    }
  return array;
}

export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
