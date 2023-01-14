class TileSelect {
  pos = { x: 0, y: 0 };
  layer = null;
  selectionBegin = null;

  constructor(layer) {
    this.layer = layer;
  }

  getCurrentTile() {
    const brush = this.layer.brush;
    return brush.length == 1 && brush[0].length == 1 ? brush[0][0] - 1 : -1;
  }

  setPosition(x, y) {
    this.selectionBegin = null;
    const tile = this.getCurrentTile();
    this.pos.x =
      Math.floor(x / this.layer.tilesize) * this.layer.tilesize -
      (Math.floor(tile * this.layer.tilesize) % this.layer.tiles.width);
    this.pos.y =
      Math.floor(y / this.layer.tilesize) * this.layer.tilesize -
      Math.floor((tile * this.layer.tilesize) / this.layer.tiles.width) * this.layer.tilesize -
      (tile == -1 ? this.layer.tilesize : 0);
    // TODO
    this.pos.x = this.pos.x.constrain(
      0,
      ig.system.width - this.layer.tiles.width - (ig.system.width % this.layer.tilesize)
    );
    this.pos.y = this.pos.y.constrain(
      0,
      ig.system.height - this.layer.tiles.height - (ig.system.height % this.layer.tilesize)
    );
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
    // TODO
    ig.system.clear("rgba(0,0,0,0.8)");
    if (!this.layer.tiles.loaded) return;
    // Tileset
    ig.system.context.lineWidth = 1;
    ig.system.context.strokeStyle = wm.config.colors.secondary;
    ig.system.context.fillStyle = wm.config.colors.clear;
    ig.system.context.fillRect(
      this.pos.x * ig.system.scale,
      this.pos.y * ig.system.scale,
      this.layer.tiles.width * ig.system.scale,
      this.layer.tiles.height * ig.system.scale
    );
    ig.system.context.strokeRect(
      this.pos.x * ig.system.scale - 0.5,
      this.pos.y * ig.system.scale - 0.5,
      this.layer.tiles.width * ig.system.scale + 1,
      this.layer.tiles.height * ig.system.scale + 1
    );

    this.layer.tiles.draw(this.pos.x, this.pos.y);

    // Selected Tile
    var tile = this.getCurrentTile();
    var tx = (Math.floor(tile * this.layer.tilesize) % this.layer.tiles.width) + this.pos.x;
    var ty =
      Math.floor((tile * this.layer.tilesize) / this.layer.tiles.width) * this.layer.tilesize +
      this.pos.y +
      (tile == -1 ? this.layer.tilesize : 0);

    // TODO
    ig.system.context.lineWidth = 1;
    ig.system.context.strokeStyle = wm.config.colors.highlight;
    ig.system.context.strokeRect(
      tx * ig.system.scale - 0.5,
      ty * ig.system.scale - 0.5,
      this.layer.tilesize * ig.system.scale + 1,
      this.layer.tilesize * ig.system.scale + 1
    );
  }

  drawCursor(x, y) {
    const r = this.getSelectionRect(x, y);
    // TODO
    ig.system.context.lineWidth = 1;
    ig.system.context.strokeStyle = wm.config.colors.selection;
    ig.system.context.strokeRect(
      (r.x * this.layer.tilesize + this.pos.x) * ig.system.scale - 0.5,
      (r.y * this.layer.tilesize + this.pos.y) * ig.system.scale - 0.5,
      r.w * this.layer.tilesize * ig.system.scale + 1,
      r.h * this.layer.tilesize * ig.system.scale + 1
    );
  }
}
