import { Guard } from "../lib/guard.js";
import { Register } from "./register.js";
import { $new } from "../lib/dom-utils.js";

export class GameImage {
  data = null;
  failed = false;
  height = 0;
  loadCallback = () => {};
  loaded = false;
  path = "";
  /** @type {System} */
  system;
  width = 0;

  constructor({ system, path } = {}) {
    Guard.againstNull({ system });
    Guard.againstNull({ path });
    this.system = system;
    this.path = path;
    this.load();
  }

  load(loadCallback) {
    this.loadCallback = loadCallback || (() => {});
    if (!this.loaded && this.system.ready) {
      this.data = new Image();
      this.data.onload = (ev) => this.onload(ev);
      this.data.onerror = (ev) => this.onerror(ev);
      this.data.src = this.path;
    } else if (this.loaded) this.loadCallback(this.path, true);
    else Register.preloadImage(this);
  }

  onload() {
    this.width = this.data.width;
    this.height = this.data.height;
    this.loaded = true;
    if (this.system.scale !== 1) this.resize(this.system.scale);
    if (this.loadCallback) this.loadCallback(this.path, true);
  }

  onerror() {
    this.failed = true;
    if (this.loadCallback) this.loadCallback(this.path, false);
  }

  /** Nearest-Neighbor scaling:
   *
   * The original image is drawn into an offscreen canvas of the same size
   * and copied into another offscreen canvas with the new size.
   * The scaled offscreen canvas becomes the image (data) of this object.*/
  resize(scale) {
    const origPixels = this.system.getImagePixels(this.data, 0, 0, this.width, this.height);
    const widthScaled = this.width * scale;
    const heightScaled = this.height * scale;

    const scaled = $new("canvas");
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
    const { scale, ctx, drawPosition } = this.system;
    targetX = drawPosition(targetX);
    targetY = drawPosition(targetY);
    sourceX = sourceX ?? 0 * scale;
    sourceY = sourceY ?? 0 * scale;
    width = (width ?? this.width) * scale;
    height = (height ?? this.height) * scale;
    ctx.drawImage(this.data, sourceX, sourceY, width, height, targetX, targetY, width, height);
  }

  drawTile(targetX, targetY, tile, tileWidth, tileHeight, flipX, flipY) {
    tileHeight = tileHeight ? tileHeight : tileWidth;

    if (!this.loaded || tileWidth > this.width || tileHeight > this.height) return;

    const { scale, ctx, drawPosition } = this.system;
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
      drawPosition(targetX) * scaleX - (flipX ? tileWidthScaled : 0),
      drawPosition(targetY) * scaleY - (flipY ? tileHeightScaled : 0),
      tileWidthScaled,
      tileHeightScaled
    );
    if (flipX || flipY) ctx.restore();
  }
}
