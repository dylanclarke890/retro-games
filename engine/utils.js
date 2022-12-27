function getPixelRatio(context) {
  console.log("Determining pixel ratio.");
  const backingStores = [
    "backingStorePixelRatio",
    "webkitBackingStorePixelRatio",
    "mozBackingStorePixelRatio",
    "msBackingStorePixelRatio",
    "oBackingStorePixelRatio",
  ];
  const deviceRatio = window.devicePixelRatio;
  const backingRatio = backingStores.reduce((_, curr) =>
    context.hasOwnProperty(curr) ? context[curr] : 1
  );

  // Get the proper pixel ratio by dividing the device ratio by the backing ratio.
  return deviceRatio / backingRatio;
}
