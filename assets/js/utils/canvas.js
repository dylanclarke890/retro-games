function getPixelRatio(context) {
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

function generateCanvas(w, h) {
  const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d");
  const ratio = getPixelRatio(ctx);

  // Set the canvas' width then downscale via CSS.
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  // Scale the context so we get accurate pixel density.
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  return canvas;
}
