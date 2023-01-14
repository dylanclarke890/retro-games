class EditMap extends BackgroundMap {
  name = "";
  visible = true;
  active = true;
  linkWithCollision = false;

  /** @type {HTMLDivElement} */
  div = null;
  brush = [[0]];
  oldData = null;
  hotkey = -1;
  ignoreLastClick = false;
  tileSelect = null;

  isSelecting = false;
  selectionBegin = null;

  constructor(name, tilesize, tileset, foreground, system) {
    tileset = tileset || "";
    super({ tilesize, data: [[0]], tileset, system, name, foreground });
    this.div = $new("div");
    this.div.className = "layer layerActive";
    this.div.id = `layer_${name}`;
    this.div.addEventListener("click", () => this.click());
    this.setName(name);
    if (this.foreground) $el("#layers").prepend(this.div);
    else $el("#layerEntities").after(this.div);
    this.tileSelect = new TileSelect(this);
  }

  getSaveData() {
    return {
      name: this.name,
      width: this.width,
      height: this.height,
      linkWithCollision: this.linkWithCollision,
      visible: this.visible,
      tilesetName: this.tilesetName,
      repeat: this.repeat,
      preRender: this.preRender,
      distance: this.distance,
      tilesize: this.tilesize,
      foreground: this.foreground,
      data: this.data,
    };
  }

  resize(newWidth, newHeight) {
    const newData = new Array(newHeight);
    for (let y = 0; y < newHeight; y++) {
      newData[y] = new Array(newWidth);
      for (let x = 0; x < newWidth; x++)
        newData[y][x] = x < this.width && y < this.height ? this.data[y][x] : 0;
    }

    this.data = newData;
    this.width = newWidth;
    this.height = newHeight;
    this.resetDiv();
  }

  beginEditing() {
    this.oldData = NativeExtensions.copy(this.data);
  }

  getOldTile(x, y) {
    const tx = Math.floor(x / this.tilesize);
    const ty = Math.floor(y / this.tilesize);
    return tx >= 0 && tx < this.width && ty >= 0 && ty < this.height ? this.oldData[ty][tx] : 0;
  }

  setTileset(tileset) {
    if (this.name === "collision") this.setCollisionTileset();
    else super().setTileset(tileset);
  }

  setCollisionTileset() {
    // TODO
    const path = wm.config.collisionTiles.path;
    const scale = this.tilesize / wm.config.collisionTiles.tilesize;
    this.tiles = new AutoResizedImage(path, scale);
  }

  //#region UI

  setHotkey(hotkey) {
    this.hotkey = hotkey;
    this.setName(this.name);
  }

  setName(name) {
    this.name = name.replace(/[^0-9a-zA-Z]/g, "_");
    this.resetDiv();
  }

  resetDiv() {
    const visClass = this.visible ? "checkedVis" : "";
    this.div.innerHTML = `
      <span class="visible ${visClass} title="Toggle Visibility (Shift+${this.hotkey})</span>
      <span class="name">${this.name}</span>
      <span class="size">${this.width}x${this.height}</span>
    `;
    this.div.title = `Select Layer (${this.hotkey})`;
    this.div
      .querySelector(".visible")
      .addEventListener("mousedown", () => this.toggleVisibilityClick());
  }

  setActive(active) {
    this.active = active;
    if (active) this.div.classList.add("layerActive");
    else this.div.classList.remove("layerActive");
  }

  toggleVisibility() {
    this.visible = !this.visible;
    this.resetDiv();
    const visibleEl = this.div.querySelector(".visible");
    if (this.visible) visibleEl.classList.add("checkedVis");
    else visibleEl.classList.remove("checkedVis");
    ig.game.draw(); // TODO
  }

  toggleVisibilityClick() {
    if (!this.active) this.ignoreLastClick = true;
    this.toggleVisibility();
  }

  click() {
    if (this.ignoreLastClick) {
      this.ignoreLastClick = false;
      return;
    }
    ig.editor.setActiveLayer(this.name);
  }

  destroy() {
    this.div.remove();
  }

  //#endregion UI

  //#region Selecting

  beginSelecting(x, y) {
    this.isSelecting = true;
    this.selectionBegin = { x: x, y: y };
  }

  endSelecting(x, y) {
    const r = this.getSelectionRect(x, y);

    const brush = [];
    for (let ty = r.y; ty < r.y + r.h; ty++) {
      const row = [];
      for (let tx = r.x; tx < r.x + r.w; tx++) {
        if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) row.push(0);
        else row.push(this.data[ty][tx]);
      }
      brush.push(row);
    }
    this.isSelecting = false;
    this.selectionBegin = null;
    return brush;
  }

  getSelectionRect(x, y) {
    const sx = this.selectionBegin ? this.selectionBegin.x : x,
      sy = this.selectionBegin ? this.selectionBegin.y : y;
    const txb = Math.floor((sx + this.scroll.x) / this.tilesize),
      tyb = Math.floor((sy + this.scroll.y) / this.tilesize),
      txe = Math.floor((x + this.scroll.x) / this.tilesize),
      tye = Math.floor((y + this.scroll.y) / this.tilesize);

    return {
      x: Math.min(txb, txe),
      y: Math.min(tyb, tye),
      w: Math.abs(txb - txe) + 1,
      h: Math.abs(tyb - tye) + 1,
    };
  }

  //#endregion Selecting

  //#region Drawing

  draw() {
    // For performance reasons, repeated background maps are not drawn when zoomed out
    if (this.visible && !(wm.config.view.zoom < 1 && this.repeat)) this.drawTiled();

    // Grid TODO
    if (this.active && wm.config.view.grid) {
      let x = -ig.system.getDrawPos(this.scroll.x % this.tilesize) - 0.5;
      let y = -ig.system.getDrawPos(this.scroll.y % this.tilesize) - 0.5;
      const step = this.tilesize * ig.system.scale;

      ig.system.context.beginPath();
      for (x; x < ig.system.realWidth; x += step) {
        ig.system.context.moveTo(x, 0);
        ig.system.context.lineTo(x, ig.system.realHeight);
      }
      for (y; y < ig.system.realHeight; y += step) {
        ig.system.context.moveTo(0, y);
        ig.system.context.lineTo(ig.system.realWidth, y);
      }
      ig.system.context.strokeStyle = wm.config.colors.secondary;
      ig.system.context.stroke();
      ig.system.context.closePath();
    }

    // Bounds
    if (this.active) {
      ig.system.context.lineWidth = 1;
      ig.system.context.strokeStyle = wm.config.colors.primary;
      ig.system.context.strokeRect(
        -ig.system.getDrawPos(this.scroll.x) - 0.5,
        -ig.system.getDrawPos(this.scroll.y) - 0.5,
        this.width * this.tilesize * ig.system.scale + 1,
        this.height * this.tilesize * ig.system.scale + 1
      );
    }
  }

  getCursorOffset() {
    const w = this.brush[0].length;
    const h = this.brush.length;
    return {
      x: (w / 2 - 0.5).toInt() * this.tilesize,
      y: (h / 2 - 0.5).toInt() * this.tilesize,
    };
  }

  drawCursor(x, y) {
    if (this.isSelecting) {
      const r = this.getSelectionRect(x, y);

      ig.system.context.lineWidth = 1;
      ig.system.context.strokeStyle = wm.config.colors.selection;
      ig.system.context.strokeRect(
        (r.x * this.tilesize - this.scroll.x) * ig.system.scale - 0.5,
        (r.y * this.tilesize - this.scroll.y) * ig.system.scale - 0.5,
        r.w * this.tilesize * ig.system.scale + 1,
        r.h * this.tilesize * ig.system.scale + 1
      );
    } else {
      const w = this.brush[0].length;
      const h = this.brush.length;
      const co = this.getCursorOffset();
      const cx =
        Math.floor((x + this.scroll.x) / this.tilesize) * this.tilesize - this.scroll.x - co.x;
      const cy =
        Math.floor((y + this.scroll.y) / this.tilesize) * this.tilesize - this.scroll.y - co.y;

      ig.system.context.lineWidth = 1;
      ig.system.context.strokeStyle = wm.config.colors.primary;
      ig.system.context.strokeRect(
        ig.system.getDrawPos(cx) - 0.5,
        ig.system.getDrawPos(cy) - 0.5,
        w * this.tilesize * ig.system.scale + 1,
        h * this.tilesize * ig.system.scale + 1
      );

      ig.system.context.globalAlpha = 0.5;
      for (let ty = 0; ty < h; ty++) {
        for (let tx = 0; tx < w; tx++) {
          const t = this.brush[ty][tx];
          if (!t) continue;
          const px = cx + tx * this.tilesize;
          const py = cy + ty * this.tilesize;
          this.tiles.drawTile(px, py, t - 1, this.tilesize);
        }
      }
      ig.system.context.globalAlpha = 1;
    }
  }

  // #endregion Drawing
}

class AutoResizedImage extends GameImage {
  internalScale = 1;

  constructor(path, internalScale, system) {
    super({ system, path });
    this.internalScale = internalScale;
  }

  onload(_event) {
    this.width = Math.ceil(this.data.width * this.internalScale);
    this.height = Math.ceil(this.data.height * this.internalScale);

    if (this.internalScale !== 1) {
      const scaled = ig.$new("canvas");
      scaled.width = this.width;
      scaled.height = this.height;
      const scaledCtx = scaled.getContext("2d");

      scaledCtx.drawImage(
        this.data,
        0,
        0,
        this.data.width,
        this.data.height,
        0,
        0,
        this.width,
        this.height
      );
      this.data = scaled;
    }

    this.loaded = true;
    if (ig.system.scale !== 1) this.resize(ig.system.scale);
    if (this.loadCallback) this.loadCallback(this.path, true);
  }
}
