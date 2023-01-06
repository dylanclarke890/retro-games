class GameImage {
  data = null;
  width = 0;
  height = 0;
  loaded = false;
  failed = false;
  loadCallback = (_path, _loadingWasSuccessful) => {};
  path = "";

  constructor({ system, path } = {}) {
    this.system = system;
    this.path = path;
    this.load();
  }

  load(loadCallback) {
    if (this.loaded) {
      if (loadCallback) loadCallback(this.path, true);
      return;
    } else if (!this.loaded && this.system.ready) {
      this.loadCallback = loadCallback || null;
      this.data = new Image();
      this.data.onload = (ev) => this.onload(ev);
      this.data.onerror = (ev) => this.onerror(ev);
      this.data.src = this.path;
    } else {
      Register.preloadImage(this);
    }
    this.system.cacheImage(this.path, this);
  }

  onload(_event) {
    this.width = this.data.width;
    this.height = this.data.height;
    this.loaded = true;
    if (this.system.scale !== 1) {
      this.resize();
    }
    if (this.loadCallback) this.loadCallback(this.path, true);
  }

  onerror(_event) {
    this.failed = true;
    if (this.loadCallback) this.loadCallback(this.path, false);
  }

  /** Nearest-Neighbor scaling:
   *
   * The original image is drawn into an offscreen canvas of the same size
   * and copied into another offscreen canvas with the new size.
   * The scaled offscreen canvas becomes the image (data) of this object.*/
  resize() {
    const scale = this.system.scale;
    const origPixels = this.system.getImagePixels(this.data, 0, 0, this.width, this.height);
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
    const scale = this.system.scale;
    sourceX = sourceX ?? 0 * scale;
    sourceY = sourceY ?? 0 * scale;
    width = (width ?? this.width) * scale;
    height = (height ?? this.height) * scale;

    this.system.ctx.drawImage(
      this.data,
      sourceX,
      sourceY,
      width,
      height,
      this.system.drawPosition(targetX),
      this.system.drawPosition(targetY),
      width,
      height
    );
  }

  drawTile(targetX, targetY, tile, tileWidth, tileHeight, flipX, flipY) {
    tileHeight = tileHeight ?? tileWidth;
    if (!this.loaded || tileWidth > this.width || tileHeight > this.height) return;

    const { scale, ctx } = this.system; // FIXME
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
      this.system.drawPosition(targetX) * scaleX - (flipX ? tileWidthScaled : 0),
      this.system.drawPosition(targetY) * scaleY - (flipY ? tileHeightScaled : 0),
      tileWidthScaled,
      tileHeightScaled
    );

    if (flipX || flipY) ctx.restore();
  }
}
