const imageCache = {};
let drawCount = 0;

class Image {
  data = null;
  width = 0;
  height = 0;
  loaded = false;
  failed = false;
  loadCallback = (_path, _loadingWasSuccessful) => {};
  path = "";

  constructor(scope, path) {
    this.scope = scope;
    this.path = path;
    this.load();
  }

  staticInstantiate(path) {
    return imageCache[path] || null;
  }

  load(loadCallback) {
    if (this.loaded) {
      if (loadCallback) loadCallback(this.path, true);
      return;
    } else if (!this.loaded && !this.scope.ready) {
      this.loadCallback = loadCallback || null;
      this.data = new Image();
      this.data.onload = this.onload;
      this.data.onerror = this.onerror;
      this.data.src = this.path;
    } else scope.addResource(this);

    imageCache[this.path] = this;
  }

  reload() {
    this.loaded = false;
    this.data = new Image();
    this.data.onload = this.onload;
    this.data.src = this.path + "?" + Date.now();
  }

  onload(_) {
    this.width = this.data.width;
    this.height = this.data.height;
    this.loaded = true;
    if (this.scope.constants.scale != 1) this.resize();
    if (this.loadCallback) this.loadCallback(this.path, true);
  }

  onerror(_) {
    this.failed = true;
    if (this.loadCallback) this.loadCallback(this.path, false);
  }

  /** Nearest-Neighbor scaling:
   *
   * The original image is drawn into an offscreen canvas of the same size
   * and copied into another offscreen canvas with the new size.
   * The scaled offscreen canvas becomes the image (data) of this object.*/
  resize() {
    const scale = this.scope.constants.scale;
    const origPixels = this.scope.renderer.getImagePixels(this.data, 0, 0, this.width, this.height);

    const widthScaled = this.width * scale;
    const heightScaled = this.height * scale;

    const scaled = document.createElement("canvas");
    scaled.width = widthScaled;
    scaled.height = heightScaled;
    const scaledCtx = scaled.getContext("2d");
    const scaledPixels = scaledCtx.getImageData(0, 0, widthScaled, heightScaled);

    for (let y = 0; y < heightScaled; y++) {
      for (let x = 0; x < widthScaled; x++) {
        const index = (Math.floor(y / scale) * this.width + Math.floor(x / scale)) * 4;
        const indexScaled = (y * widthScaled + x) * 4;
        scaledPixels.data[indexScaled] = origPixels.data[index];
        scaledPixels.data[indexScaled + 1] = origPixels.data[index + 1];
        scaledPixels.data[indexScaled + 2] = origPixels.data[index + 2];
        scaledPixels.data[indexScaled + 3] = origPixels.data[index + 3];
      }
    }
    scaledCtx.putImageData(scaledPixels, 0, 0);
    this.data = scaled;
  }

  draw(targetX, targetY, sourceX, sourceY, width, height) {
    if (!this.loaded) return;

    const scale = this.scope.constants.scale;
    sourceX = sourceX ? sourceX * scale : 0;
    sourceY = sourceY ? sourceY * scale : 0;
    width = (width ? width : this.width) * scale;
    height = (height ? height : this.height) * scale;

    this.scope.ctx.drawImage(
      this.data,
      sourceX,
      sourceY,
      width,
      height,
      ig.system.getDrawPos(targetX), // TODO
      ig.system.getDrawPos(targetY),
      width,
      height
    );

    drawCount++;
  }

  drawTile(targetX, targetY, tile, tileWidth, tileHeight, flipX, flipY) {
    tileHeight = tileHeight ? tileHeight : tileWidth;
    if (!this.loaded || tileWidth > this.width || tileHeight > this.height) return;

    const scale = this.scope.constants.scale,
      ctx = this.scope.ctx;
    const tileWidthScaled = Math.floor(tileWidth * scale);
    const tileHeightScaled = Math.floor(tileHeight * scale);

    const scaleX = flipX ? -1 : 1;
    const scaleY = flipY ? -1 : 1;

    if (flipX || flipY) {
      ctx.save();
      ctx.scale(scaleX, scaleY);
    }
    ctx.drawImage(
      this.data,
      (Math.floor(tile * tileWidth) % this.width) * scale,
      Math.floor((tile * tileWidth) / this.width) * tileHeight * scale,
      tileWidthScaled,
      tileHeightScaled,
      ig.system.getDrawPos(targetX) * scaleX - (flipX ? tileWidthScaled : 0), // TODO
      ig.system.getDrawPos(targetY) * scaleY - (flipY ? tileHeightScaled : 0),
      tileWidthScaled,
      tileHeightScaled
    );

    if (flipX || flipY) ctx.restore();
    drawCount++;
  }
}
