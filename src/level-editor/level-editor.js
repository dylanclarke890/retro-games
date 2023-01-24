class LevelEditor {
  activeLayer = null;
  collisionLayer = null;
  collisionSolid = 1;
  config = null;
  deleteLayerDialog = null;
  entities = null;
  /** @type {EventedInput} */
  input = null;
  fileName = "untitled.js";
  filePath = "";
  httpClient = null;
  labelsStep = 32;
  layers = [];
  levelData = {};
  levelSavePathDialog = null;
  loadDialog = null;
  loseChangesDialog = null;
  mode = null;
  MODE = {
    DRAW: 1,
    TILESELECT: 2,
    ENTITYSELECT: 4,
  };
  modified = false;
  mouseLast = { x: -1, y: -1 };
  needsDraw = true;
  _rscreen = { x: 0, y: 0 };
  /** @type {ModalDialogPathSelect} */
  saveDialog = null;
  undo = null;
  screen = { x: 0, y: 0 };
  selectedEntity = null;
  /** @type {System} */
  system = null;
  tilesetSelectDialog = null;
  waitForModeChange = false;

  static getMaxWidth() {
    return window.innerWidth;
  }

  static getMaxHeight() {
    return window.innerHeight - $el("#headerMenu").clientHeight;
  }

  constructor({ system, config, input, httpClient, media } = {}) {
    Guard.againstNull({ system });
    Guard.againstNull({ config });
    Guard.againstNull({ input });
    Guard.againstNull({ httpClient });
    Guard.againstNull({ media });

    this.system = system;
    this.config = config;
    this.input = input;
    this.httpClient = httpClient;
    this.media = media;
    this.undo = new Undo({ levels: config.undoLevels, editor: this });
    this.filePath = config.project.levelPath + this.fileName;
    this.mode = this.MODE.DEFAULT;

    const { ctx } = this.system;
    ctx.textBaseline = "top";
    ctx.font = config.labels.font;
    this.labelsStep = config.labels.step;

    this.initDialogs();

    this.entities = new EditEntities({
      config: this.config,
      div: $el("#layerEntities"),
      editor: this,
      httpClient: this.httpClient,
      media: this.media,
      undo: this.undo,
      system: this.system,
    });

    $("#layers").sortable({
      update: () => this.reorderLayers(),
    });
    $("#layers").disableSelection();
    this.resetModified();

    this.initEvents();

    if (config.loadLastLevel) {
      const path = getCookie("levelEditorLastLevel");
      if (path) this.load(null, path);
    }

    requestAnimationFrame(() => this.drawIfNeeded());
  }

  initDialogs() {
    this.loadDialog = new ModalDialogPathSelect({
      text: "Load Level",
      okText: "Load",
      type: "scripts",
      httpClient: this.httpClient,
    });
    this.loadDialog.onOk = (dialog, path) => this.load(dialog, path);
    this.loadDialog.setPath(this.config.project.levelPath);
    $el("#levelLoad").addEventListener("click", () => this.showLoadDialog());
    $el("#levelNew").addEventListener("click", () => this.showNewDialog());

    this.saveDialog = new ModalDialogPathSelect({
      text: "Save Level",
      okText: "Save",
      type: "scripts",
      httpClient: this.httpClient,
    });
    this.saveDialog.onOk = this.save;
    this.saveDialog.setPath(this.config.project.levelPath);
    $el("#levelSaveAs").addEventListener("click", () => this.saveDialog.open());
    $el("#levelSave").addEventListener("click", () => this.saveQuick());

    this.loseChangesDialog = new ModalDialog({ text: "Lose all changes?", autoInit: true });

    this.deleteLayerDialog = new ModalDialog({
      text: "Delete Layer? NO UNDO!",
      autoInit: true,
    });
    this.deleteLayerDialog.onOk = this.removeLayer;

    this.tilesetSelectDialog = new SelectFileDropdown({
      elementId: "#layerTileset",
      httpClient: this.httpClient,
      filetype: "images",
    });
  }

  initEvents() {
    const config = this.config;
    if (config.touchScroll) {
      this.system.canvas.addEventListener("wheel", (e) => this.touchScroll(e), false); // Setup wheel event
      delete config.binds["MWHEEL_UP"]; // Unset MWHEEL_* binds
      delete config.binds["MWHEEL_DOWN"];
    }

    for (let key in config.binds) this.input.bind(Input.KEY[key], config.binds[key]);
    this.input.keydownCallback = (action) => this.keydown(action);
    this.input.keyupCallback = (action) => this.keyup(action);
    this.input.mousemoveCallback = () => this.mousemove();

    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (e) => this.uikeydown(e));
    if (config.askBeforeClose) window.addEventListener("beforeunload", (e) => this.confirmClose(e));

    $el("#buttonAddLayer").addEventListener("click", () => this.addLayer());
    $el("#buttonRemoveLayer").addEventListener("click", () => this.deleteLayerDialog.open());
    $el("#buttonSaveLayerSettings").addEventListener("click", () => this.saveLayerSettings());
    // $el("#reloadImages").addEventListener("click", ig.Image.reloadCache); // TODO
    $el("#layerIsCollision").addEventListener("change", (e) => this.toggleCollisionLayer(e));

    $el("input#toggleSidebar").addEventListener("click", () => {
      slideToggle($el("div#menu"));
      $el("input#toggleSidebar").classList.toggle("active");
    });

    this.system.canvas.addEventListener("click", () =>
      // Always unfocus current input field when clicking the canvas
      document.querySelectorAll("input:focus").forEach((v) => v.blur())
    );
  }

  uikeydown(event) {
    if (event.target.type === "text") return;
    const key = String.fromCharCode(event.which);
    if (key.match(/^\d$/)) {
      const index = parseInt(key);
      const name = $("#layers div.layer:nth-child(" + index + ") span.name").text();
      const layer = name === "entities" ? this.entities : this.getLayerWithName(name);
      if (!layer) return;
      if (event.shiftKey) layer.toggleVisibility();
      else this.setActiveLayer(layer.name);
    }
  }

  showLoadDialog() {
    if (this.modified) {
      this.loseChangesDialog.onOk = () => this.loadDialog.open();
      this.loseChangesDialog.open();
    } else this.loadDialog.open();
  }

  showNewDialog() {
    if (this.modified) {
      this.loseChangesDialog.onOk = () => this.loadNew();
      this.loseChangesDialog.open();
    } else this.loadNew();
  }

  setModified() {
    if (!this.modified) {
      this.modified = true;
      this.setWindowTitle();
    }
  }

  resetModified() {
    this.modified = false;
    this.setWindowTitle();
  }

  setWindowTitle() {
    document.title = this.fileName + (this.modified ? " * " : " - ") + "LevelEditor";
    document.querySelectorAll("span.headerTitle").forEach((v) => (v.textContent = this.fileName));
    document
      .querySelectorAll("span.unsavedTitle")
      .forEach((v) => (v.textContent = this.modified ? "*" : ""));
  }

  confirmClose(event) {
    const returnValue = undefined;
    if (this.modified && this.config.askBeforeClose) returnValue = "Unsaved changes. Leave anyway?";
    event.returnValue = returnValue;
    return returnValue;
  }

  resize() {
    const system = this.system;
    const config = this.config;
    system.resize(
      Math.floor(LevelEditor.getMaxWidth() / config.view.zoom),
      Math.floor(LevelEditor.getMaxHeight() / config.view.zoom),
      config.view.zoom
    );
    system.ctx.textBaseline = "top";
    system.ctx.font = config.labels.font;
    this.draw();
  }

  scroll(x, y) {
    const scale = this.system.scale;
    this.screen.x -= x;
    this.screen.y -= y;

    this._rscreen.x = Math.round(this.screen.x * scale) / scale;
    this._rscreen.y = Math.round(this.screen.y * scale) / scale;
    for (let i = 0; i < this.layers.length; i++)
      this.layers[i].setScreenPos(this.screen.x, this.screen.y);
  }

  drag() {
    const dx = this.input.mouse.x - this.mouseLast.x,
      dy = this.input.mouse.y - this.mouseLast.y;
    this.scroll(dx, dy);
  }

  touchScroll(event) {
    const scale = this.system.scale;
    event.preventDefault();
    this.scroll(-event.deltaX / scale, -event.deltaY / scale);
    this.draw();
    return false;
  }

  zoom(delta) {
    const config = this.config;
    const z = config.view.zoom;
    const mx = this.input.mouse.x * z,
      my = this.input.mouse.y * z;

    if (z <= 1) {
      if (delta < 0) z /= 2;
      else z *= 2;
    } else z += delta;

    config.view.zoom = z.constrain(config.view.zoomMin, config.view.zoomMax);
    config.labels.step = Math.round(this.labelsStep / config.view.zoom);
    // TODO
    $("#zoomIndicator")
      .text(config.view.zoom + "x")
      .stop(true, true)
      .show()
      .delay(300)
      .fadeOut();

    // Adjust mouse pos and screen coordinates
    this.input.mouse.x = mx / config.view.zoom;
    this.input.mouse.y = my / config.view.zoom;
    this.drag();

    // for (let i in ig.Image.cache) {
    //   ig.Image.cache[i].resize(config.view.zoom);
    // } // TODO

    this.resize();
  }

  //#region Loading

  loadNew() {
    setCookie("levelEditorLastLevel", null);
    while (this.layers.length) {
      this.layers[0].destroy();
      this.layers.splice(0, 1);
    }
    this.screen = { x: 0, y: 0 };
    this.entities.clear();
    this.fileName = "untitled.js";
    this.filePath = this.config.project.levelPath + "untitled.js";
    this.levelData = {};
    this.saveDialog.setPath(this.filePath);
    this.resetModified();
    this.draw();
  }

  load(_dialog, path) {
    this.filePath = path;
    this.saveDialog.setPath(path);
    this.fileName = path.replace(/^.*\//, "");

    this.httpClient.api
      .file(path, { parseResponse: false })
      .then((data) => this.loadResponse(data));
  }

  loadResponse(data) {
    if (!data) {
      console.debug("LevelEditor: loadResponse called but no data provided.");
      return;
    }
    setCookie("levelEditorLastLevel", this.filePath);

    // extract JS object from level data.
    const jsonMatch = data.match(/\/\*JSON-BEGIN\*\/\s?([\s\S]*?);?\s?\/\*JSON-END\*/);
    if (jsonMatch) {
      let json = jsonMatch[1];
      // Some keys may be stored in modern JS format i.e without quotes. Find and replace them.
      const matches = json.match(/(\w+):/g);
      matches.forEach((v) => {
        // v = match + : - we want it to be "match":
        const match = v.substring(0, v.length - 1);
        json = json.replace(v, `\"${match}\":`);
      });
      // Remove all trailing commas on arrays and objects.
      json = json.replace(/\,(?=\s*[}|\]])/gm, "");
      // Finally, we can parse it:
      data = JSON.parse(json);
    }

    this.levelData = data;

    while (this.layers.length) {
      this.layers[0].destroy();
      this.layers.splice(0, 1);
    }
    this.screen = { x: 0, y: 0 };
    this.entities.clear();

    for (let i = 0; i < data.entities.length; i++) {
      const ent = data.entities[i];
      this.entities.spawnEntity(ent.type, ent.x, ent.y, ent.settings);
    }

    for (let i = 0; i < data.layer.length; i++) {
      const ld = data.layer[i];
      const newLayer = new EditMap({
        name: ld.name,
        tilesize: ld.tilesize,
        tileset: ld.tilesetName,
        foreground: !!ld.foreground,
        system: this.system,
        config: this.config,
        editor: this,
      });
      newLayer.resize(ld.width, ld.height);
      newLayer.linkWithCollision = ld.linkWithCollision;
      newLayer.repeat = ld.repeat;
      newLayer.preRender = !!ld.preRender;
      newLayer.distance = ld.distance;
      newLayer.visible = !ld.visible;
      newLayer.data = ld.data;
      newLayer.toggleVisibility();
      this.layers.push(newLayer);

      if (ld.name == "collision") this.collisionLayer = newLayer;
      this.setActiveLayer(ld.name);
    }

    this.setActiveLayer("entities");

    this.reorderLayers();
    $("#layers").sortable("refresh");

    this.resetModified();
    this.undo.clear();
    this.draw();
  }

  //#endregion Loading

  //#region Saving

  saveQuick() {
    if (this.fileName === "untitled.js") this.saveDialog.open();
    else this.save(null, this.filePath);
  }

  save(_dialog, path) {
    if (!path.match(/\.js$/)) path += ".js";
    console.log(path);
    this.filePath = path;
    this.fileName = path.replace(/^.*\//, "");
    const data = this.levelData;
    data.entities = this.entities.getSaveData();
    data.layer = [];

    const resources = [];
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      data.layer.push(layer.getSaveData());
      if (layer.name !== "collision") resources.push(layer.tiles.path);
    }

    let dataString = JSON.stringify(data);
    if (this.config.project.prettyPrint) dataString = JSONFormat(dataString);
    const levelName = this.fileName.substring(0, this.fileName.lastIndexOf("."));
    dataString = `const ${levelName} = /*JSON-BEGIN*/ ${dataString}; /*JSON-END*/`;

    this.httpClient.api
      .save(path, dataString)
      .then((res) => this.saveResponse(res))
      .catch((err) => console.error(err));
  }

  saveResponse(data) {
    if (data.error) {
      console.error(data.msg);
    } else {
      this.resetModified();
      setCookie("levelEditorLastLevel", this.filePath);
    }
  }

  //#endregion Saving

  //#region Layers

  addLayer() {
    const name = "new_layer_" + this.layers.length;
    const newLayer = new EditMap({
      name,
      tilesize: this.config.layerDefaults.tilesize,
      system: this.system,
      config: this.config,
    });
    newLayer.resize(this.config.layerDefaults.width, this.config.layerDefaults.height);
    newLayer.setScreenPos(this.screen.x, this.screen.y);
    this.layers.push(newLayer);
    this.setActiveLayer(name);
    this.updateLayerSettings();
    this.reorderLayers();
    $("#layers").sortable("refresh"); // TODO
  }

  removeLayer() {
    const name = this.activeLayer.name;
    if (name === "entities") return false;
    this.activeLayer.destroy();
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name !== name) continue;
      this.layers.splice(i, 1);
      this.reorderLayers();
      $("#layers").sortable("refresh"); // TODO
      this.setActiveLayer("entities");
      return true;
    }
    return false;
  }

  getLayerWithName(name) {
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name !== name) continue;
      return this.layers[i];
    }
    return null;
  }

  reorderLayers() {
    const newLayers = [];
    let isForegroundLayer = true;
    document.querySelectorAll("#layers div.layer span.name").forEach((el, i) => {
      const name = el.textContent;
      const layer = name === "entities" ? this.entities : this.getLayerWithName(name);
      if (!layer) return;
      layer.setHotkey(i + 1);
      // All layers after the entity layer are not foreground layers
      if (layer.name === "entities") isForegroundLayer = false;
      else {
        layer.foreground = isForegroundLayer;
        newLayers.unshift(layer);
      }
    });
    this.layers = newLayers;
    this.setModified();
    this.draw();
  }

  updateLayerSettings() {
    $el("#layerName").value = this.activeLayer.name;
    $el("#layerTileset").value = this.activeLayer.tilesetName;
    $el("#layerTilesize").value = this.activeLayer.tilesize;
    $el("#layerWidth").value = this.activeLayer.width;
    $el("#layerHeight").value = this.activeLayer.height;
    $el("#layerDistance").value = this.activeLayer.distance;
    $el("#layerPreRender").checked = this.activeLayer.preRender;
    $el("#layerRepeat").checked = this.activeLayer.repeat;
    $el("#layerLinkWithCollision").checked = this.activeLayer.linkWithCollision;
  }

  saveLayerSettings() {
    const isCollision = $el("#layerIsCollision").checked;
    let newName = $el("#layerName").value;
    const newWidth = Math.floor($el("#layerWidth").value);
    const newHeight = Math.floor($el("#layerHeight").value);

    if (newWidth !== this.activeLayer.width || newHeight !== this.activeLayer.height)
      this.activeLayer.resize(newWidth, newHeight);
    this.activeLayer.tilesize = Math.floor($el("#layerTilesize").value);

    if (isCollision) {
      newName = "collision";
      this.activeLayer.linkWithCollision = false;
      this.activeLayer.distance = 1;
      this.activeLayer.repeat = false;
      this.activeLayer.setCollisionTileset();
    } else {
      const newTilesetName = $el("#layerTileset").value;
      if (newTilesetName !== this.activeLayer.tilesetName)
        this.activeLayer.setTileset(newTilesetName);
      this.activeLayer.linkWithCollision = $el("#layerLinkWithCollision").checked;
      this.activeLayer.distance = parseFloat($el("#layerDistance").value);
      this.activeLayer.repeat = $el("#layerRepeat").checked;
      this.activeLayer.preRender = $el("#layerPreRender").checked;
    }

    // Is a collision layer
    if (newName === "collision") this.collisionLayer = this.activeLayer;
    // Was a collision layer, but is no more
    else if (this.activeLayer.name == "collision") this.collisionLayer = null;

    this.activeLayer.setName(newName);
    this.setModified();
    this.draw();
  }

  setActiveLayer(name) {
    const previousLayer = this.activeLayer;
    this.activeLayer = name === "entities" ? this.entities : this.getLayerWithName(name);
    if (previousLayer === this.activeLayer) return; // nothing to do here
    if (previousLayer) previousLayer.setActive(false);

    this.activeLayer.setActive(true);
    this.mode = this.MODE.DEFAULT;
    $el("#layerIsCollision").checked = name === "collision";

    if (name === "entities") fadeOut($el("#layerSettings"), { duration: 100 });
    else {
      this.entities.selectEntity(null);
      this.toggleCollisionLayer();
      fadeOut($el("#layerSettings"), {
        duration: 100,
        cb: (el) => {
          this.updateLayerSettings();
          fadeIn(el, { duration: 100 });
        },
      });
    }
    this.draw();
  }

  toggleCollisionLayer() {
    const isCollision = $el("#layerIsCollision").checked;
    const elementsToUpdate = [
      "#layerLinkWithCollision",
      "#layerDistance",
      "#layerPreRender",
      "#layerRepeat",
      "#layerName",
      "#layerTileset",
    ];
    elementsToUpdate.forEach((v) => ($el(v).disabled = isCollision));
  }

  //#endregion Layers

  //#region Update

  mousemove() {
    if (!this.activeLayer) return;

    if (this.mode === this.MODE.DEFAULT) {
      // scroll map
      if (this.input.state("drag")) this.drag();
      else if (this.input.state("draw")) {
        // move/scale entity
        if (this.activeLayer === this.entities) {
          const x = this.input.mouse.x + this.screen.x;
          const y = this.input.mouse.y + this.screen.y;
          this.entities.dragOnSelectedEntity(x, y);
          this.setModified();
        }

        // draw on map
        else if (!this.activeLayer.isSelecting) this.setTileOnCurrentLayer();
      } else if (this.activeLayer === this.entities) {
        const x = this.input.mouse.x + this.screen.x;
        const y = this.input.mouse.y + this.screen.y;
        this.entities.mousemove(x, y);
      }
    }

    this.mouseLast = { ...this.input.mouse };
    this.draw();
  }

  keydown(action) {
    if (!this.activeLayer) return;

    if (action === "draw") {
      if (this.mode === this.MODE.DEFAULT) {
        // select entity
        if (this.activeLayer === this.entities) {
          const x = this.input.mouse.x + this.screen.x;
          const y = this.input.mouse.y + this.screen.y;
          const entity = this.entities.selectEntityAt(x, y);
          if (entity) this.undo.beginEntityEdit(entity);
        } else {
          if (this.input.state("select"))
            this.activeLayer.beginSelecting(this.input.mouse.x, this.input.mouse.y);
          else {
            this.undo.beginMapDraw();
            this.activeLayer.beginEditing();
            if (
              this.activeLayer.linkWithCollision &&
              this.collisionLayer &&
              this.collisionLayer !== this.activeLayer
            )
              this.collisionLayer.beginEditing();

            this.setTileOnCurrentLayer();
          }
        }
      } else if (this.mode === this.MODE.TILESELECT && this.input.state("select"))
        this.activeLayer.tileSelect.beginSelecting(this.input.mouse.x, this.input.mouse.y);
    }

    this.draw();
  }

  keyup(action) {
    if (!this.activeLayer) return;

    switch (action) {
      case "delete":
        this.entities.deleteSelectedEntity();
        this.setModified();
        break;
      case "clone":
        this.entities.cloneSelectedEntity();
        this.setModified();
        break;
      case "grid":
        this.config.view.grid = !this.config.view.grid;
        break;
      case "menu":
        if (this.mode !== this.MODE.TILESELECT && this.mode !== this.MODE.ENTITYSELECT) {
          if (this.activeLayer === this.entities) {
            this.mode = this.MODE.ENTITYSELECT;
            this.entities.showMenu(this.input.mouse.x, this.input.mouse.y);
          } else {
            this.mode = this.MODE.TILESELECT;
            this.activeLayer.tileSelect.setPosition(this.input.mouse.x, this.input.mouse.y);
          }
        } else {
          this.mode = this.MODE.DEFAULT;
          this.entities.hideMenu();
        }
        break;
      case "zoomin":
        this.zoom(1);
        break;
      case "zoomout":
        this.zoom(-1);
        break;
      case "draw":
        // select tile
        if (this.mode === this.MODE.TILESELECT) {
          this.activeLayer.brush = this.activeLayer.tileSelect.endSelecting(
            this.input.mouse.x,
            this.input.mouse.y
          );
          this.mode = this.MODE.DEFAULT;
        } else if (this.activeLayer === this.entities) this.undo.endEntityEdit();
        else if (this.activeLayer.isSelecting) {
          this.activeLayer.brush = this.activeLayer.endSelecting(
            this.input.mouse.x,
            this.input.mouse.y
          );
        } else this.undo.endMapDraw();
        break;
      case "undo":
        this.undo.undo();
        break;
      case "redo":
        this.undo.redo();
        break;
      default:
        throw new Error(`Unknown action: ${action}.`);
    }
    this.draw();
    this.mouseLast = { ...this.input.mouse };
  }

  setTileOnCurrentLayer() {
    if (!this.activeLayer || !this.activeLayer.scroll) return;
    const co = this.activeLayer.getCursorOffset();
    const x = this.input.mouse.x + this.activeLayer.scroll.x - co.x;
    const y = this.input.mouse.y + this.activeLayer.scroll.y - co.y;

    const brush = this.activeLayer.brush;
    for (let by = 0; by < brush.length; by++) {
      const brushRow = brush[by];
      for (let bx = 0; bx < brushRow.length; bx++) {
        const mapx = x + bx * this.activeLayer.tilesize;
        const mapy = y + by * this.activeLayer.tilesize;

        const newTile = brushRow[bx];
        const oldTile = this.activeLayer.getOldTile(mapx, mapy);

        this.activeLayer.setTile(mapx, mapy, newTile);
        this.undo.pushMapDraw(this.activeLayer, mapx, mapy, oldTile, newTile);

        if (
          this.activeLayer.linkWithCollision &&
          this.collisionLayer &&
          this.collisionLayer !== this.activeLayer
        ) {
          const collisionLayerTile = newTile > 0 ? this.collisionSolid : 0;
          const oldCollisionTile = this.collisionLayer.getOldTile(mapx, mapy);

          this.collisionLayer.setTile(mapx, mapy, collisionLayerTile);
          this.undo.pushMapDraw(
            this.collisionLayer,
            mapx,
            mapy,
            oldCollisionTile,
            collisionLayerTile
          );
        }
      }
    }

    this.setModified();
  }

  //#endregion Update

  //#region Drawing

  /** The actual drawing loop is already scheduled, this just sets a flag
   *  to indicate that a redraw is needed. */
  draw() {
    this.needsDraw = true;
  }

  drawIfNeeded() {
    // Only draw if flag is set
    if (!this.needsDraw) return;
    this.needsDraw = false;
    this.system.clear(this.config.colors.clear);

    let entitiesDrawn = false;
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      // If layer is a foreground layer, draw entities first.
      if (!entitiesDrawn && layer.foreground) {
        entitiesDrawn = true;
        this.entities.draw();
      }
      layer.draw();
    }

    if (!entitiesDrawn) this.entities.draw();

    if (this.activeLayer) {
      if (this.mode === this.MODE.TILESELECT) {
        this.activeLayer.tileSelect.draw();
        this.activeLayer.tileSelect.drawCursor(this.input.mouse.x, this.input.mouse.y);
      } else if (this.mode === this.MODE.DEFAULT)
        this.activeLayer.drawCursor(this.input.mouse.x, this.input.mouse.y);
    }

    if (this.config.labels.draw) this.drawLabels(this.config.labels.step);
  }

  drawLabels(step) {
    const { ctx, height, width, scale } = this.system;
    ctx.fillStyle = this.config.colors.primary;
    let xlabel = this.screen.x - (this.screen.x % step) - step;
    for (let tx = Math.floor(-this.screen.x % step); tx < width; tx += step) {
      xlabel += step;
      ctx.fillText(xlabel, tx * scale, 0);
    }

    let ylabel = this.screen.y - (this.screen.y % step) - step;
    for (let ty = Math.floor(-this.screen.y % step); ty < height; ty += step) {
      ylabel += step;
      ctx.fillText(ylabel, 0, ty * scale);
    }
  }

  //#endregion Drawing

  getEntityByName(name) {
    return this.entities.getEntityByName(name);
  }
}

/** Custom loader, used to skip sound files and the run loop creation. */
class LevelEditorLoader extends GameLoader {
  httpClient = null;
  config = null;

  constructor({ config, httpClient, ...opts }) {
    super(opts);
    Guard.againstNull({ httpClient });
    Guard.againstNull({ config });
    this.httpClient = httpClient;
    this.config = config;
  }

  end() {
    if (this.done) return;
    clearInterval(this.intervalId);
    this.done = true;
    this.runner.system.clear(this.config.colors.clear);
    this.runner.setGame(this.gameClass);
  }
}

class LevelEditorRunner {
  httpClient = null;
  config = null;
  game = null;
  input = null;
  loader = null;
  ready = false;
  soundManager = null;
  system = null;

  constructor() {
    this.httpClient = new LevelEditorHttpClient();
    this.config = levelEditorConfig;
    this.system = new System({
      runner: this,
      canvasId: "canvas",
      fps: 1,
      width: Math.floor(LevelEditor.getMaxWidth() / this.config.view.zoom),
      height: Math.floor(LevelEditor.getMaxHeight() / this.config.view.zoom),
      scale: this.config.view.zoom,
    });
    this.input = new EventedInput({ system: this.system });
    this.soundManager = new SoundManager(this);
    this.media = new MediaFactory({ system: this.system, soundManager: this.soundManager });
    this.injectImageOverrides();
    this.ready = true;

    this.loader = new LevelEditorLoader({
      httpClient: this.httpClient,
      config: this.config,
      debugMode: false,
      gameClass: LevelEditor,
      runner: this,
    });
    this.loader.load();
  }

  setGame(gameClass) {
    this.game = new gameClass({
      httpClient: this.httpClient,
      config: this.config,
      input: this.input,
      system: this.system,
      media: this.media,
    });
  }

  /** Image overrides for the LevelEditor. To make the zoom function work, we need to
   *  keep the original image, maintain a cache of scaled versions and use the default
   *  Canvas scaling (~bicubic) instead of nearest neighbor when zooming out. */
  injectImageOverrides() {
    GameImage.prototype.baseResize = GameImage.prototype.resize;
    GameImage.prototype.resize = function (scale) {
      if (!this.loaded) return;
      if (!this.scaleCache) this.scaleCache = {};
      if (this.scaleCache["x" + scale]) {
        this.data = this.scaleCache["x" + scale];
        return;
      }

      // Retain the original image when scaling
      this.origData = this.data = this.origData || this.data;

      // Nearest neighbor when zooming in
      if (scale > 1) this.baseResize(scale);
      // Otherwise blur
      else {
        const scaled = $new("canvas");
        scaled.width = Math.ceil(this.width * scale);
        scaled.height = Math.ceil(this.height * scale);
        const scaledCtx = scaled.getContext("2d");
        scaledCtx.drawImage(
          this.data,
          0,
          0,
          this.width,
          this.height,
          0,
          0,
          scaled.width,
          scaled.height
        );
        this.data = scaled;
      }

      this.scaleCache["x" + scale] = this.data;
    };
  }
}

const runner = new LevelEditorRunner();
