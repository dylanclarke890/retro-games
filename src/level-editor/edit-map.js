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

  constructor({ name, tilesize, tileset, foreground, system, config }) {
    tileset = tileset || "";
    super({ tilesize, data: [[0]], tileset, system, name, foreground });
    Guard.againstNull({ config });
    this.config = config;

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
    else super.setTileset(tileset);
  }

  setCollisionTileset() {
    const path = this.config.collisionTiles.path;
    const internalScale = this.tilesize / this.config.collisionTiles.tilesize;
    this.tiles = new AutoResizedImage({ path, internalScale, system: this.system, config });
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
    this.editor.draw();
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
    this.editor.setActiveLayer(this.name);
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
    const { view, colors } = this.config;
    // For performance reasons, repeated background maps are not drawn when zoomed out
    if (this.visible && !(view.zoom < 1 && this.repeat)) this.drawTiled();

    const { drawPosition, scale, ctx, realHeight, realWidth } = this.system;
    if (this.active && view.grid) {
      let x = -drawPosition(this.scroll.x % this.tilesize) - 0.5;
      let y = -drawPosition(this.scroll.y % this.tilesize) - 0.5;
      const step = this.tilesize * scale;

      ctx.beginPath();
      for (x; x < realWidth; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, realHeight);
      }
      for (y; y < realHeight; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(realWidth, y);
      }
      ctx.strokeStyle = colors.secondary;
      ctx.stroke();
      ctx.closePath();
    }

    // Bounds
    if (this.active) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.primary;
      ctx.strokeRect(
        -drawPosition(this.scroll.x) - 0.5,
        -drawPosition(this.scroll.y) - 0.5,
        this.width * this.tilesize * scale + 1,
        this.height * this.tilesize * scale + 1
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
    const { scale, ctx } = this.system;
    if (this.isSelecting) {
      const r = this.getSelectionRect(x, y);
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.config.colors.selection;
      ctx.strokeRect(
        (r.x * this.tilesize - this.scroll.x) * scale - 0.5,
        (r.y * this.tilesize - this.scroll.y) * scale - 0.5,
        r.w * this.tilesize * scale + 1,
        r.h * this.tilesize * scale + 1
      );
      return;
    }

    const w = this.brush[0].length;
    const h = this.brush.length;
    const co = this.getCursorOffset();
    const cx =
      Math.floor((x + this.scroll.x) / this.tilesize) * this.tilesize - this.scroll.x - co.x;
    const cy =
      Math.floor((y + this.scroll.y) / this.tilesize) * this.tilesize - this.scroll.y - co.y;

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.config.colors.primary;
    ctx.strokeRect(
      ig.system.getDrawPos(cx) - 0.5,
      ig.system.getDrawPos(cy) - 0.5,
      w * this.tilesize * scale + 1,
      h * this.tilesize * scale + 1
    );

    ctx.globalAlpha = 0.5;
    for (let ty = 0; ty < h; ty++) {
      for (let tx = 0; tx < w; tx++) {
        const t = this.brush[ty][tx];
        if (!t) continue;
        const px = cx + tx * this.tilesize;
        const py = cy + ty * this.tilesize;
        this.tiles.drawTile(px, py, t - 1, this.tilesize);
      }
    }
    ctx.globalAlpha = 1;
  }

  // #endregion Drawing
}

class AutoResizedImage extends GameImage {
  internalScale = 1;

  constructor({ path, internalScale, system }) {
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
    if (this.system.scale !== 1) this.resize(this.system.scale);
    if (this.loadCallback) this.loadCallback(this.path, true);
  }
}
