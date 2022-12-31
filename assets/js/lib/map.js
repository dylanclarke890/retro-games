class GameMap {
  tilesize = 8;
  width = 1;
  height = 1;
  pxWidth = 1;
  pxHeight = 1;
  data = [[]];
  name = null;

  constructor(tilesize, data) {
    this.tilesize = tilesize;
    this.data = data;
    this.height = data.length;
    this.width = data[0].length;
    this.pxWidth = this.width * this.tilesize;
    this.pxHeight = this.height * this.tilesize;
  }

  #isValidMapCoords(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getTile(x, y) {
    const tx = Math.floor(x / this.tilesize);
    const ty = Math.floor(y / this.tilesize);
    return this.#isValidMapCoords(tx, ty) ? this.data[ty][tx] : 0;
  }

  setTile(x, y, tile) {
    const tx = Math.floor(x / this.tilesize);
    const ty = Math.floor(y / this.tilesize);
    if (this.#isValidMapCoords(tx, ty)) this.data[ty][tx] = tile;
  }
}
