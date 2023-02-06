import { Guard } from "../modules/lib/guard.js";
import { constrain } from "../modules/lib/number-utils.js";

export class TileSelect {
  layer = null;
  pos = { x: 0, y: 0 };
  selectionBegin = null;
  /** @type {System} */
  system = null;

  constructor({ layer, system, config } = {}) {
    Guard.againstNull({ layer });
    Guard.againstNull({ system });
    Guard.againstNull({ config });
    this.layer = layer;
    this.system = system;
    this.config = config;
  }

  getCurrentTile() {
    const brush = this.layer.brush;
    return brush.length === 1 && brush[0].length === 1 ? brush[0][0] - 1 : -1;
  }

  setPosition(x, y) {
    this.selectionBegin = null;
    const tile = this.getCurrentTile();
    const { tilesize, tiles } = this.layer;
    const { width, height } = this.system;
    this.pos.x = Math.floor(x / tilesize) * tilesize - (Math.floor(tile * tilesize) % tiles.width);
    this.pos.y =
      Math.floor(y / tilesize) * tilesize -
      Math.floor((tile * tilesize) / tiles.width) * tilesize -
      (tile === -1 ? tilesize : 0);
    this.pos.x = constrain(this.pos.x, 0, width - tiles.width - (width % tilesize));
    this.pos.y = constrain(this.pos.y, 0, height - tiles.height - (height % tilesize));
  }

  beginSelecting(x, y) {
    this.selectionBegin = { x, y };
  }

  endSelecting(x, y) {
    const r = this.getSelectionRect(x, y);
    const mw = Math.floor(this.layer.tiles.width / this.layer.tilesize);
    const mh = Math.floor(this.layer.tiles.height / this.layer.tilesize);
    const brush = [];

    for (let ty = r.y; ty < r.y + r.h; ty++) {
      const row = [];
      for (let tx = r.x; tx < r.x + r.w; tx++) {
        if (tx < 0 || ty < 0 || tx >= mw || ty >= mh) row.push(0);
        else row.push(ty * Math.floor(this.layer.tiles.width / this.layer.tilesize) + tx + 1);
      }
      brush.push(row);
    }
    this.selectionBegin = null;
    return brush;
  }

  getSelectionRect(x, y) {
    const sx = this.selectionBegin ? this.selectionBegin.x : x,
      sy = this.selectionBegin ? this.selectionBegin.y : y;
    const txb = Math.floor((sx - this.pos.x) / this.layer.tilesize),
      tyb = Math.floor((sy - this.pos.y) / this.layer.tilesize),
      txe = Math.floor((x - this.pos.x) / this.layer.tilesize),
      tye = Math.floor((y - this.pos.y) / this.layer.tilesize);

    return {
      x: Math.min(txb, txe),
      y: Math.min(tyb, tye),
      w: Math.abs(txb - txe) + 1,
      h: Math.abs(tyb - tye) + 1,
    };
  }

  draw() {
    this.system.clear("rgba(0,0,0,0.8)");
    const { scale, ctx } = this.system;
    if (!this.layer.tiles.loaded) return;
    // Tileset
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.config.colors.secondary;
    ctx.fillStyle = this.config.colors.clear;
    ctx.fillRect(
      this.pos.x * scale,
      this.pos.y * scale,
      this.layer.tiles.width * scale,
      this.layer.tiles.height * scale
    );
    ctx.strokeRect(
      this.pos.x * scale - 0.5,
      this.pos.y * scale - 0.5,
      this.layer.tiles.width * scale + 1,
      this.layer.tiles.height * scale + 1
    );

    this.layer.tiles.draw(this.pos.x, this.pos.y);

    // Selected Tile
    const tile = this.getCurrentTile();
    const tx = (Math.floor(tile * this.layer.tilesize) % this.layer.tiles.width) + this.pos.x;
    const ty =
      Math.floor((tile * this.layer.tilesize) / this.layer.tiles.width) * this.layer.tilesize +
      this.pos.y +
      (tile === -1 ? this.layer.tilesize : 0);

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.config.colors.highlight;
    ctx.strokeRect(
      tx * scale - 0.5,
      ty * scale - 0.5,
      this.layer.tilesize * scale + 1,
      this.layer.tilesize * scale + 1
    );
  }

  drawCursor(x, y) {
    const r = this.getSelectionRect(x, y);
    const { ctx, scale } = this.system;
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.config.colors.selection;
    ctx.strokeRect(
      (r.x * this.layer.tilesize + this.pos.x) * scale - 0.5,
      (r.y * this.layer.tilesize + this.pos.y) * scale - 0.5,
      r.w * this.layer.tilesize * scale + 1,
      r.h * this.layer.tilesize * scale + 1
    );
  }
}
