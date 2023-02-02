import { $new } from "../lib/dom-utils.js";
import { Guard } from "../lib/guard.js";
import { GameImage } from "../core/image.js";
import { toInt } from "../lib/number-utils.js";

export class GameMap {
  tilesize = 8;
  width = 1;
  height = 1;
  pxWidth = 1;
  pxHeight = 1;
  data = [[]];
  name = null;
  /** @type {System} */
  system = null;

  constructor({ system, tilesize, data }) {
    Guard.againstNull({ system });
    this.tilesize = tilesize;
    this.data = data || [[]];
    this.system = system;
    this.height = this.data.length;
    this.width = this.data[0].length;
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

export class BackgroundMap extends GameMap {
  anims = {};
  chunkSize = 512;
  debugChunks = false;
  distance = 1;
  enabled = true;
  foreground = false;
  preRender = false;
  preRenderedChunks = null;
  repeat = false;
  scroll = { x: 0, y: 0 };
  tiles = null;
  tilesetName = "";

  constructor({
    anims,
    data,
    distance,
    foreground,
    name,
    preRender,
    repeat,
    system,
    tileset,
    tilesize,
    autoset,
  }) {
    super({ system, tilesize, data });
    this.anims = anims || {};
    this.distance = distance || 1;
    this.foreground = !!foreground;
    this.name = name;
    this.preRender = !!preRender;
    this.repeat = !!repeat;
    if (autoset !== false) this.setTileset(tileset);
  }

  setTileset(tileset) {
    this.tilesetName = tileset instanceof GameImage ? tileset.path : tileset;
    this.tiles = new GameImage({ system: this.system, path: this.tilesetName });
    this.preRenderedChunks = null;
  }

  setScreenPos(x, y) {
    this.scroll.x = x / this.distance;
    this.scroll.y = y / this.distance;
  }

  preRenderMapToChunks() {
    const totalWidth = this.width * this.tilesize * this.system.scale,
      totalHeight = this.height * this.tilesize * this.system.scale;
    // If this layer is smaller than the chunkSize, adjust the chunkSize
    // accordingly, so we don't have as much overdraw
    this.chunkSize = Math.min(Math.max(totalWidth, totalHeight), this.chunkSize);
    const chunkCols = Math.ceil(totalWidth / this.chunkSize),
      chunkRows = Math.ceil(totalHeight / this.chunkSize);

    this.preRenderedChunks = [];
    for (let y = 0; y < chunkRows; y++) {
      this.preRenderedChunks[y] = [];
      for (let x = 0; x < chunkCols; x++) {
        const chunkWidth = x === chunkCols - 1 ? totalWidth - x * this.chunkSize : this.chunkSize;
        const chunkHeight = y === chunkRows - 1 ? totalHeight - y * this.chunkSize : this.chunkSize;
        this.preRenderedChunks[y][x] = this.preRenderChunk(x, y, chunkWidth, chunkHeight);
      }
    }
  }

  preRenderChunk(cx, cy, w, h) {
    const tw = w / this.tilesize / this.system.scale + 1,
      th = h / this.tilesize / this.system.scale + 1;
    const nx = ((cx * this.chunkSize) / this.system.scale) % this.tilesize,
      ny = ((cy * this.chunkSize) / this.system.scale) % this.tilesize;
    const tx = Math.floor((cx * this.chunkSize) / this.tilesize / this.system.scale),
      ty = Math.floor((cy * this.chunkSize) / this.tilesize / this.system.scale);

    const chunk = $new("canvas");
    chunk.width = w;
    chunk.height = h;

    const chunkContext = chunk.getContext("2d");
    this.system.scaleMode(chunk, chunkContext);

    const screenContext = this.system.ctx;
    this.system.ctx = chunkContext;

    for (let x = 0; x < tw; x++) {
      for (let y = 0; y < th; y++) {
        if (x + tx < this.width && y + ty < this.height) {
          const tile = this.data[y + ty][x + tx];
          if (!tile) continue;
          this.tiles.drawTile(
            x * this.tilesize - nx,
            y * this.tilesize - ny,
            tile - 1,
            this.tilesize
          );
        }
      }
    }
    this.system.ctx = screenContext;

    /**  Workaround for Chrome 49 bug - handling many offscreen canvases
     * slows down the browser significantly so we convert the
     * canvas to an image instead. */
    const image = new Image();
    image.width = chunk.width;
    image.height = chunk.height;
    image.src = chunk.toDataURL();

    return image;
  }

  draw() {
    if (!this.tiles.loaded || !this.enabled) return;
    if (this.preRender) this.drawPreRendered();
    else this.drawTiled();
  }

  drawPreRendered() {
    if (!this.preRenderedChunks) this.preRenderMapToChunks();

    let dx = this.system.drawPosition(this.scroll.x),
      dy = this.system.drawPosition(this.scroll.y);

    if (this.repeat) {
      const scaledTileSize = this.tilesize * this.system.scale;
      const w = this.width * scaledTileSize,
        h = this.height * scaledTileSize;
      dx = ((dx % w) + w) % w;
      dy = ((dy % h) + h) % h;
    }

    let minChunkX = Math.max(Math.floor(dx / this.chunkSize), 0),
      minChunkY = Math.max(Math.floor(dy / this.chunkSize), 0),
      maxChunkX = Math.ceil((dx + this.system.realWidth) / this.chunkSize),
      maxChunkY = Math.ceil((dy + this.system.realHeight) / this.chunkSize),
      maxRealChunkX = this.preRenderedChunks[0].length,
      maxRealChunkY = this.preRenderedChunks.length;

    if (!this.repeat) {
      maxChunkX = Math.min(maxChunkX, maxRealChunkX);
      maxChunkY = Math.min(maxChunkY, maxRealChunkY);
    }

    let nudgeY = 0;
    for (let cy = minChunkY; cy < maxChunkY; cy++) {
      let nudgeX = 0;
      for (let cx = minChunkX; cx < maxChunkX; cx++) {
        const chunk = this.preRenderedChunks[cy % maxRealChunkY][cx % maxRealChunkX];

        const x = -dx + cx * this.chunkSize - nudgeX;
        const y = -dy + cy * this.chunkSize - nudgeY;
        this.system.ctx.drawImage(chunk, x, y);

        if (this.debugChunks) {
          this.system.ctx.strokeStyle = "#f0f";
          this.system.ctx.strokeRect(x, y, this.chunkSize, this.chunkSize);
        }

        // If we repeat in X and this chunk's width wasn't the full chunk size
        // and the screen is not already filled, we need to draw another chunk
        // AND nudge it to be flush with the last chunk
        if (
          this.repeat &&
          chunk.width < this.chunkSize &&
          x + chunk.width < this.system.realWidth
        ) {
          nudgeX += this.chunkSize - chunk.width;
          // Only re-calculate maxChunkX during initial row to avoid
          // unnecessary off-screen draws on subsequent rows.
          if (cy === minChunkY) maxChunkX++;
        }

        // Same as above, but for Y
        if (
          this.repeat &&
          chunk.height < this.chunkSize &&
          y + chunk.height < this.system.realHeight
        ) {
          nudgeY += this.chunkSize - chunk.height;
          maxChunkY++;
        }
      }
    }
  }

  drawTiled() {
    let tile = 0,
      anim = null,
      tileOffsetX = toInt(this.scroll.x / this.tilesize),
      tileOffsetY = toInt(this.scroll.y / this.tilesize),
      pxOffsetX = this.scroll.x % this.tilesize,
      pxOffsetY = this.scroll.y % this.tilesize,
      pxMinX = -pxOffsetX - this.tilesize,
      pxMinY = -pxOffsetY - this.tilesize,
      pxMaxX = this.system.width + this.tilesize - pxOffsetX,
      pxMaxY = this.system.height + this.tilesize - pxOffsetY;

    // FIXME: could be sped up for non-repeated maps: restrict the for loops
    // to the map size instead of to the screen size and skip the 'repeat'
    // checks inside the loop.
    for (let mapY = -1, pxY = pxMinY; pxY < pxMaxY; mapY++, pxY += this.tilesize) {
      let tileY = mapY + tileOffsetY;
      // Repeat Y?
      if (tileY >= this.height || tileY < 0) {
        if (!this.repeat) continue;
        tileY = ((tileY % this.height) + this.height) % this.height;
      }

      for (let mapX = -1, pxX = pxMinX; pxX < pxMaxX; mapX++, pxX += this.tilesize) {
        let tileX = mapX + tileOffsetX;
        // Repeat X?
        if (tileX >= this.width || tileX < 0) {
          if (!this.repeat) continue;
          tileX = ((tileX % this.width) + this.width) % this.width;
        }

        // Draw!
        tile = this.data[tileY][tileX];
        if (!tile) continue;

        anim = this.anims[tile - 1];
        if (anim) anim.draw(pxX, pxY);
        else this.tiles.drawTile(pxX, pxY, tile - 1, this.tilesize);
      } // end for x
    } // end for y
  }
}

export class CollisionMap extends GameMap {
  lastSlope = 1;
  tiledef = null;

  /** Default Slope Tile definition. Each tile is defined by an array of 5 vars:
   * - 4 for the line in tile coordinates (0 -- 1)
   * - 1 specifing whether the tile is 'filled' behind the line or not
   * @example [ x1, y1, x2, y2, solid ]. */
  static get defaultTileDef() {
    // Defining 'half', 'one third' and 'two thirds' as vars  makes it a bit
    // easier to read... I hope.
    const H = 1 / 2,
      N = 1 / 3,
      M = 2 / 3,
      SOLID = true,
      NON_SOLID = false;
    return {
      /* 15 NE */ 5: [0, 1, 1, M, SOLID],
      6: [0, M, 1, N, SOLID],
      7: [0, N, 1, 0, SOLID],
      /* 22 NE */ 3: [0, 1, 1, H, SOLID],
      4: [0, H, 1, 0, SOLID],
      /* 45 NE */ 2: [0, 1, 1, 0, SOLID],
      /* 67 NE */ 10: [H, 1, 1, 0, SOLID],
      21: [0, 1, H, 0, SOLID],
      /* 75 NE */ 32: [M, 1, 1, 0, SOLID],
      43: [N, 1, M, 0, SOLID],
      54: [0, 1, N, 0, SOLID],

      /* 15 SE */ 27: [0, 0, 1, N, SOLID],
      28: [0, N, 1, M, SOLID],
      29: [0, M, 1, 1, SOLID],
      /* 22 SE */ 25: [0, 0, 1, H, SOLID],
      26: [0, H, 1, 1, SOLID],
      /* 45 SE */ 24: [0, 0, 1, 1, SOLID],
      /* 67 SE */ 11: [0, 0, H, 1, SOLID],
      22: [H, 0, 1, 1, SOLID],
      /* 75 SE */ 33: [0, 0, N, 1, SOLID],
      44: [N, 0, M, 1, SOLID],
      55: [M, 0, 1, 1, SOLID],

      /* 15 NW */ 16: [1, N, 0, 0, SOLID],
      17: [1, M, 0, N, SOLID],
      18: [1, 1, 0, M, SOLID],
      /* 22 NW */ 14: [1, H, 0, 0, SOLID],
      15: [1, 1, 0, H, SOLID],
      /* 45 NW */ 13: [1, 1, 0, 0, SOLID],
      /* 67 NW */ 8: [H, 1, 0, 0, SOLID],
      19: [1, 1, H, 0, SOLID],
      /* 75 NW */ 30: [N, 1, 0, 0, SOLID],
      41: [M, 1, N, 0, SOLID],
      52: [1, 1, M, 0, SOLID],

      /* 15 SW */ 38: [1, M, 0, 1, SOLID],
      39: [1, N, 0, M, SOLID],
      40: [1, 0, 0, N, SOLID],
      /* 22 SW */ 36: [1, H, 0, 1, SOLID],
      37: [1, 0, 0, H, SOLID],
      /* 45 SW */ 35: [1, 0, 0, 1, SOLID],
      /* 67 SW */ 9: [1, 0, H, 1, SOLID],
      20: [H, 0, 0, 1, SOLID],
      /* 75 SW */ 31: [1, 0, M, 1, SOLID],
      42: [M, 0, N, 1, SOLID],
      53: [N, 0, 0, 1, SOLID],

      /* Go N  */ 12: [0, 0, 1, 0, NON_SOLID],
      /* Go S  */ 23: [1, 1, 0, 1, NON_SOLID],
      /* Go E  */ 34: [1, 0, 1, 1, NON_SOLID],
      /* Go W  */ 45: [0, 1, 0, 0, NON_SOLID],
    };
  }

  static get staticNoCollision() {
    return {
      trace: function (x, y, vx, vy) {
        return {
          collision: { x: false, y: false, slope: false },
          pos: { x: x + vx, y: y + vy },
          tile: { x: 0, y: 0 },
        };
      },
    };
  }

  constructor({ system, tilesize, data, tiledef }) {
    super({ system, tilesize, data });
    this.tiledef = tiledef || CollisionMap.defaultTileDef;
    for (let t in this.tiledef) if (t | (0 > this.lastSlope)) this.lastSlope = t | 0;
  }

  trace(x, y, vx, vy, objectWidth, objectHeight) {
    // Set up the trace-result
    const res = {
      collision: { x: false, y: false, slope: false },
      pos: { x: x, y: y },
      tile: { x: 0, y: 0 },
    };
    // Break the trace down into smaller steps if necessary.
    // We add a little extra movement (0.1 px) when calculating the number of steps required,
    // to force an additional trace step whenever vx or vy is a factor of tilesize. This
    // prevents the trace step from skipping through the very first tile.
    const steps = Math.ceil((Math.max(Math.abs(vx), Math.abs(vy)) + 0.1) / this.tilesize);
    if (steps === 1) {
      this.#traceStep(res, x, y, vx, vy, objectWidth, objectHeight, vx, vy, 0);
      return res;
    }
    let sx = vx / steps;
    let sy = vy / steps;
    for (let i = 0; i < steps && (sx || sy); i++) {
      this.#traceStep(res, x, y, sx, sy, objectWidth, objectHeight, vx, vy, i);
      x = res.pos.x;
      y = res.pos.y;
      if (res.collision.x) {
        sx = 0;
        vx = 0;
      }
      if (res.collision.y) {
        sy = 0;
        vy = 0;
      }
      if (res.collision.slope) break;
    }
    return res;
  }

  #traceStep(res, x, y, vx, vy, width, height, rvx, rvy, step) {
    res.pos.x += vx;
    res.pos.y += vy;

    let tile = 0;

    // Horizontal collision (walls)
    if (vx) {
      const pxOffsetX = vx > 0 ? width : 0;
      const tileOffsetX = vx < 0 ? this.tilesize : 0;

      const firstTileY = Math.max(Math.floor(y / this.tilesize), 0);
      const lastTileY = Math.min(Math.ceil((y + height) / this.tilesize), this.height);
      const tileX = Math.floor((res.pos.x + pxOffsetX) / this.tilesize);

      // We need to test the new tile position as well as the current one, as we
      // could still collide with the current tile if it's a line def.
      // We can skip this test if this is not the first step or the new tile position
      // is the same as the current one.
      let prevTileX = Math.floor((x + pxOffsetX) / this.tilesize);
      if (step > 0 || tileX === prevTileX || prevTileX < 0 || prevTileX >= this.width)
        prevTileX = -1;

      // Still inside this collision map?
      if (tileX >= 0 && tileX < this.width) {
        for (let tileY = firstTileY; tileY < lastTileY; tileY++) {
          if (prevTileX !== -1) {
            tile = this.data[tileY][prevTileX];
            if (
              tile > 1 &&
              tile <= this.lastSlope &&
              this.#checkTileDef(res, tile, x, y, rvx, rvy, width, height, prevTileX, tileY) &&
              res.collision.slope.ny !== 0
            )
              break;
          }

          tile = this.data[tileY][tileX];
          if (
            tile === 1 ||
            tile > this.lastSlope || // fully solid tile?
            (tile > 1 && this.#checkTileDef(res, tile, x, y, rvx, rvy, width, height, tileX, tileY)) // slope?
          ) {
            if (tile > 1 && tile <= this.lastSlope && res.collision.slope) break;
            // full tile collision!
            res.collision.x = true;
            res.tile.x = tile;
            x = res.pos.x = tileX * this.tilesize - pxOffsetX + tileOffsetX;
            rvx = 0;
            break;
          }
        }
      }
    }

    // Vertical collision (floor, ceiling)
    if (vy) {
      const pxOffsetY = vy > 0 ? height : 0;
      const tileOffsetY = vy < 0 ? this.tilesize : 0;

      const firstTileX = Math.max(Math.floor(res.pos.x / this.tilesize), 0);
      const lastTileX = Math.min(Math.ceil((res.pos.x + width) / this.tilesize), this.width);
      const tileY = Math.floor((res.pos.y + pxOffsetY) / this.tilesize);

      let prevTileY = Math.floor((y + pxOffsetY) / this.tilesize);
      if (step > 0 || tileY === prevTileY || prevTileY < 0 || prevTileY >= this.height)
        prevTileY = -1;

      // Still inside this collision map?
      if (tileY >= 0 && tileY < this.height) {
        for (let tileX = firstTileX; tileX < lastTileX; tileX++) {
          if (prevTileY !== -1) {
            tile = this.data[prevTileY][tileX];
            if (
              tile > 1 &&
              tile <= this.lastSlope &&
              this.#checkTileDef(res, tile, x, y, rvx, rvy, width, height, tileX, prevTileY) &&
              res.collision.slope.nx !== 0
            )
              break;
          }

          tile = this.data[tileY][tileX];
          if (
            tile === 1 ||
            tile > this.lastSlope || // fully solid tile?
            (tile > 1 && this.#checkTileDef(res, tile, x, y, rvx, rvy, width, height, tileX, tileY)) // slope?
          ) {
            if (tile > 1 && tile <= this.lastSlope && res.collision.slope) break;

            // full tile collision!
            res.collision.y = true;
            res.tile.y = tile;
            res.pos.y = tileY * this.tilesize - pxOffsetY + tileOffsetY;
            break;
          }
        }
      }
    }
  }

  #checkTileDef(res, t, x, y, vx, vy, width, height, tileX, tileY) {
    const def = this.tiledef[t];
    if (!def) return false;

    const lx = (tileX + def[0]) * this.tilesize,
      ly = (tileY + def[1]) * this.tilesize,
      lvx = (def[2] - def[0]) * this.tilesize,
      lvy = (def[3] - def[1]) * this.tilesize,
      solid = def[4];

    // Find the box corner to test, relative to the line
    const tx = x + vx + (lvy < 0 ? width : 0) - lx,
      ty = y + vy + (lvx > 0 ? height : 0) - ly;

    // Is the box corner behind the line?
    if (lvx * ty - lvy * tx <= 0) return false;

    // Lines are only solid from one side - find the dot product of
    // line normal and movement vector and dismiss if wrong side
    if (vx * -lvy + vy * lvx < 0) return solid;

    // Find the line normal
    const length = Math.sqrt(lvx * lvx + lvy * lvy);
    const nx = lvy / length,
      ny = -lvx / length;

    // Project out of the line
    const proj = tx * nx + ty * ny;
    const px = nx * proj,
      py = ny * proj;

    // If we project further out than we moved in, then this is a full
    // tile collision for solid tiles.
    // For non-solid tiles, make sure we were in front of the line.
    if (px * px + py * py >= vx * vx + vy * vy)
      return solid || lvx * (ty - vy) - lvy * (tx - vx) < 0.5;

    res.pos.x = x + vx - px;
    res.pos.y = y + vy - py;
    res.collision.slope = { x: lvx, y: lvy, nx: nx, ny: ny };
    return true;
  }
}
