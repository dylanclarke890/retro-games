var wm = {};
wm.entityFiles = [];

class LevelEditor {
  mode = null;
  MODE = {
    DRAW: 1,
    TILESELECT: 2,
    ENTITYSELECT: 4,
  };

  levelData = {};
  layers = [];
  entities = null;
  activeLayer = null;
  collisionLayer = null;
  selectedEntity = null;

  screen = { x: 0, y: 0 };
  _rscreen = { x: 0, y: 0 };
  mouseLast = { x: -1, y: -1 };
  waitForModeChange = false;

  tilesetSelectDialog = null;
  levelSavePathDialog = null;
  labelsStep = 32;

  collisionSolid = 1;

  loadDialog = null;
  /** @type {ModalDialogPathSelect} */
  saveDialog = null;
  loseChangesDialog = null;
  deleteLayerDialog = null;
  fileName = "untitled.js";
  filePath = wm.config.project.levelPath + "untitled.js";
  modified = false;
  needsDraw = true;

  undo = null;
  /** @type {System} */
  system = null;
  /** @type {EventedInput} */
  input = null;

  static getMaxWidth() {
    return window.innerWidth;
  }

  static getMaxHeight() {
    return window.innerHeight - $el("#headerMenu").clientHeight;
  }

  constructor({ system, config, input }) {
    Guard.againstNull({ system });
    Guard.againstNull({ config });
    Guard.againstNull({ input });
    this.system = system;
    this.config = config;
    this.input = input;

    const { ctx, canvas } = this.system;
    ctx.textBaseline = "top";
    ctx.font = config.labels.font;
    this.labelsStep = config.labels.step;

    // Dialogs
    this.loadDialog = new ModalDialogPathSelect("Load Level", "Load", "scripts");
    this.loadDialog.onOk = this.load;
    this.loadDialog.setPath(config.project.levelPath);
    $el("#levelLoad").addEventListener("click", () => this.showLoadDialog());
    $el("#levelNew").addEventListener("click", () => this.showNewDialog());

    this.saveDialog = new ModalDialogPathSelect("Save Level", "Save", "scripts");
    this.saveDialog.onOk = this.save;
    this.saveDialog.setPath(config.project.levelPath);
    $el("#levelSaveAs").addEventListener("click", () => this.saveDialog.open());
    $el("#levelSave").addEventListener("click", () => this.saveQuick());

    this.loseChangesDialog = new ModalDialog("Lose all changes?");
    this.deleteLayerDialog = new ModalDialog("Delete Layer? NO UNDO!");
    this.deleteLayerDialog.onOk = this.removeLayer;
    this.mode = this.MODE.DEFAULT;

    this.tilesetSelectDialog = new SelectFileDropdown("#layerTileset", config.api.browse, "images");
    this.entities = new EditEntities($el("#layerEntities"));

    $("#layers").sortable({
      update: () => this.reorderLayers(),
    });
    $("#layers").disableSelection();
    this.resetModified();

    // Events/Input
    if (config.touchScroll) {
      // Setup wheel event
      canvas.addEventListener("wheel", (e) => this.touchScroll(e), false);
      // Unset MWHEEL_* binds
      delete config.binds["MWHEEL_UP"];
      delete config.binds["MWHEEL_DOWN"];
    }

    for (let key in config.binds) input.bind(Input.KEY[key], config.binds[key]);
    this.input.keydownCallback = (action) => this.keydown(action);
    this.input.keyupCallback = (action) => this.keyup(action);
    this.input.mousemoveCallback = () => this.mousemove();

    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (e) => this.uikeydown(e));
    window.addEventListener("beforeunload", (e) => this.confirmClose(e));

    $el("#buttonAddLayer").addEventListener("click", () => this.addLayer());
    $el("#buttonRemoveLayer").addEventListener("click", this.deleteLayerDialog.open());
    $el("#buttonSaveLayerSettings").addEventListener("click", () => this.saveLayerSettings());
    // $el("#reloadImages").addEventListener("click", ig.Image.reloadCache); // TODO
    $el("#layerIsCollision").addEventListener("change", (e) => this.toggleCollisionLayer(e));

    $el("input#toggleSidebar").addEventListener("click", () => {
      $("div#menu").slideToggle("fast"); // TODO
      $el("input#toggleSidebar").classList.toggle("active");
    });

    // Always unfocus current input field when clicking the canvas
    $el("#canvas").addEventListener("mousedown", () =>
      document.querySelectorAll("input:focus").forEach((v) => v.blur())
    );

    this.undo = new Undo(config.undoLevels);

    if (config.loadLastLevel) {
      var path = getCookie("wmLastLevel");
      if (path) this.load(null, path);
    }

    requestAnimationFrame(() => this.drawIfNeeded());
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
      .text(wm.config.view.zoom + "x")
      .stop(true, true)
      .show()
      .delay(300)
      .fadeOut();

    // Adjust mouse pos and screen coordinates
    this.input.mouse.x = mx / config.view.zoom;
    this.input.mouse.y = my / config.view.zoom;
    this.drag();

    // for (let i in ig.Image.cache) {
    //   ig.Image.cache[i].resize(wm.config.view.zoom);
    // } // TODO

    this.resize();
  }

  //#region Loading

  loadNew() {
    setCookie("wmLastLevel", null);
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

    $.ajax({
      url: path + "?nocache=" + Math.random(),
      dataType: "text",
      async: false,
      success: this.loadResponse.bind(this),
      error() {
        clearCookie("wmLastLevel");
      },
    });
  }

  loadResponse(data) {
    setCookie("wmLastLevel", this.filePath);

    // extract JSON from a module's JS
    const jsonMatch = data.match(/\/\*JSON\[\*\/([\s\S]*?)\/\*\]JSON\*\//);
    data = JSON.parse(jsonMatch ? jsonMatch[1] : data);
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
      const newLayer = new EditMap(ld.name, ld.tilesize, ld.tilesetName, !!ld.foreground);
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
    this.filePath = path;
    this.fileName = path.replace(/^.*\//, "");
    const data = this.levelData;
    data.entities = this.entities.getSaveData();
    data.layer = [];

    var resources = [];
    for (var i = 0; i < this.layers.length; i++) {
      var layer = this.layers[i];
      data.layer.push(layer.getSaveData());
      if (layer.name !== "collision") resources.push(layer.tiles.path);
    }

    const dataString = JSON.stringify(data);
    if (wm.config.project.prettyPrint) dataString = JSONFormat(dataString);

    const postString =
      "path=" + encodeURIComponent(path) + "&data=" + encodeURIComponent(dataString);
    $.ajax({
      url: this.config.api.save,
      type: "POST",
      dataType: "json",
      async: false,
      data: postString,
      success: (res) => this.saveResponse(res),
    });
  }

  saveResponse(data) {
    if (data.error) alert("Error: " + data.msg);
    else {
      this.resetModified();
      setCookie("wmLastLevel", this.filePath);
    }
  }

  //#endregion Saving

  //#region Layers

  addLayer() {
    var name = "new_layer_" + this.layers.length;
    var newLayer = new wm.EditMap(name, wm.config.layerDefaults.tilesize);
    newLayer.resize(wm.config.layerDefaults.width, wm.config.layerDefaults.height);
    newLayer.setScreenPos(this.screen.x, this.screen.y);
    this.layers.push(newLayer);
    this.setActiveLayer(name);
    this.updateLayerSettings();

    this.reorderLayers();

    $("#layers").sortable("refresh");
  }

  removeLayer() {
    var name = this.activeLayer.name;
    if (name == "entities") {
      return false;
    }
    this.activeLayer.destroy();
    for (var i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name == name) {
        this.layers.splice(i, 1);
        this.reorderLayers();
        $("#layers").sortable("refresh");
        this.setActiveLayer("entities");
        return true;
      }
    }
    return false;
  }

  getLayerWithName(name) {
    for (var i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name == name) {
        return this.layers[i];
      }
    }
    return null;
  }

  reorderLayers() {
    var newLayers = [];
    var isForegroundLayer = true;
    $("#layers div.layer span.name").each(
      function (newIndex, span) {
        var name = $(span).text();

        var layer = name == "entities" ? this.entities : this.getLayerWithName(name);

        if (layer) {
          layer.setHotkey(newIndex + 1);
          if (layer.name == "entities") {
            // All layers after the entity layer are not foreground
            // layers
            isForegroundLayer = false;
          } else {
            layer.foreground = isForegroundLayer;
            newLayers.unshift(layer);
          }
        }
      }.bind(this)
    );
    this.layers = newLayers;
    this.setModified();
    this.draw();
  }

  updateLayerSettings() {
    $("#layerName").val(this.activeLayer.name);
    $("#layerTileset").val(this.activeLayer.tilesetName);
    $("#layerTilesize").val(this.activeLayer.tilesize);
    $("#layerWidth").val(this.activeLayer.width);
    $("#layerHeight").val(this.activeLayer.height);
    $("#layerPreRender").prop("checked", this.activeLayer.preRender);
    $("#layerRepeat").prop("checked", this.activeLayer.repeat);
    $("#layerLinkWithCollision").prop("checked", this.activeLayer.linkWithCollision);
    $("#layerDistance").val(this.activeLayer.distance);
  }

  saveLayerSettings() {
    var isCollision = $("#layerIsCollision").prop("checked");

    var newName = $("#layerName").val();
    var newWidth = Math.floor($("#layerWidth").val());
    var newHeight = Math.floor($("#layerHeight").val());

    if (newWidth != this.activeLayer.width || newHeight != this.activeLayer.height) {
      this.activeLayer.resize(newWidth, newHeight);
    }
    this.activeLayer.tilesize = Math.floor($("#layerTilesize").val());

    if (isCollision) {
      newName = "collision";
      this.activeLayer.linkWithCollision = false;
      this.activeLayer.distance = 1;
      this.activeLayer.repeat = false;
      this.activeLayer.setCollisionTileset();
    } else {
      var newTilesetName = $("#layerTileset").val();
      if (newTilesetName != this.activeLayer.tilesetName) {
        this.activeLayer.setTileset(newTilesetName);
      }
      this.activeLayer.linkWithCollision = $("#layerLinkWithCollision").prop("checked");
      this.activeLayer.distance = parseFloat($("#layerDistance").val());
      this.activeLayer.repeat = $("#layerRepeat").prop("checked");
      this.activeLayer.preRender = $("#layerPreRender").prop("checked");
    }

    if (newName == "collision") {
      // is collision layer
      this.collisionLayer = this.activeLayer;
    } else if (this.activeLayer.name == "collision") {
      // was collision layer, but is no more
      this.collisionLayer = null;
    }

    this.activeLayer.setName(newName);
    this.setModified();
    this.draw();
  }

  setActiveLayer(name) {
    var previousLayer = this.activeLayer;
    this.activeLayer = name == "entities" ? this.entities : this.getLayerWithName(name);
    if (previousLayer == this.activeLayer) {
      return; // nothing to do here
    }

    if (previousLayer) {
      previousLayer.setActive(false);
    }
    this.activeLayer.setActive(true);
    this.mode = this.MODE.DEFAULT;

    $("#layerIsCollision").prop("checked", name == "collision");

    if (name == "entities") {
      $("#layerSettings").fadeOut(100);
    } else {
      this.entities.selectEntity(null);
      this.toggleCollisionLayer();
      $("#layerSettings").fadeOut(100, this.updateLayerSettings.bind(this)).fadeIn(100);
    }
    this.draw();
  }

  toggleCollisionLayer(ev) {
    var isCollision = $("#layerIsCollision").prop("checked");
    $(
      "#layerLinkWithCollision,#layerDistance,#layerPreRender,#layerRepeat,#layerName,#layerTileset"
    ).attr("disabled", isCollision);
  }

  //#endregion Layers

  //#region Update

  mousemove() {
    if (!this.activeLayer) {
      return;
    }

    if (this.mode == this.MODE.DEFAULT) {
      // scroll map
      if (ig.input.state("drag")) {
        this.drag();
      } else if (ig.input.state("draw")) {
        // move/scale entity
        if (this.activeLayer == this.entities) {
          var x = ig.input.mouse.x + this.screen.x;
          var y = ig.input.mouse.y + this.screen.y;
          this.entities.dragOnSelectedEntity(x, y);
          this.setModified();
        }

        // draw on map
        else if (!this.activeLayer.isSelecting) {
          this.setTileOnCurrentLayer();
        }
      } else if (this.activeLayer == this.entities) {
        var x = ig.input.mouse.x + this.screen.x;
        var y = ig.input.mouse.y + this.screen.y;
        this.entities.mousemove(x, y);
      }
    }

    this.mouseLast = { x: ig.input.mouse.x, y: ig.input.mouse.y };
    this.draw();
  }

  keydown(action) {
    if (!this.activeLayer) {
      return;
    }

    if (action == "draw") {
      if (this.mode == this.MODE.DEFAULT) {
        // select entity
        if (this.activeLayer == this.entities) {
          var x = ig.input.mouse.x + this.screen.x;
          var y = ig.input.mouse.y + this.screen.y;
          var entity = this.entities.selectEntityAt(x, y);
          if (entity) {
            this.undo.beginEntityEdit(entity);
          }
        } else {
          if (ig.input.state("select")) {
            this.activeLayer.beginSelecting(ig.input.mouse.x, ig.input.mouse.y);
          } else {
            this.undo.beginMapDraw();
            this.activeLayer.beginEditing();
            if (
              this.activeLayer.linkWithCollision &&
              this.collisionLayer &&
              this.collisionLayer != this.activeLayer
            ) {
              this.collisionLayer.beginEditing();
            }
            this.setTileOnCurrentLayer();
          }
        }
      } else if (this.mode == this.MODE.TILESELECT && ig.input.state("select")) {
        this.activeLayer.tileSelect.beginSelecting(ig.input.mouse.x, ig.input.mouse.y);
      }
    }

    this.draw();
  }

  keyup(action) {
    if (!this.activeLayer) {
      return;
    }

    if (action == "delete") {
      this.entities.deleteSelectedEntity();
      this.setModified();
    } else if (action == "clone") {
      this.entities.cloneSelectedEntity();
      this.setModified();
    } else if (action == "grid") {
      wm.config.view.grid = !wm.config.view.grid;
    } else if (action == "menu") {
      if (this.mode != this.MODE.TILESELECT && this.mode != this.MODE.ENTITYSELECT) {
        if (this.activeLayer == this.entities) {
          this.mode = this.MODE.ENTITYSELECT;
          this.entities.showMenu(ig.input.mouse.x, ig.input.mouse.y);
        } else {
          this.mode = this.MODE.TILESELECT;
          this.activeLayer.tileSelect.setPosition(ig.input.mouse.x, ig.input.mouse.y);
        }
      } else {
        this.mode = this.MODE.DEFAULT;
        this.entities.hideMenu();
      }
    } else if (action == "zoomin") {
      this.zoom(1);
    } else if (action == "zoomout") {
      this.zoom(-1);
    }

    if (action == "draw") {
      // select tile
      if (this.mode == this.MODE.TILESELECT) {
        this.activeLayer.brush = this.activeLayer.tileSelect.endSelecting(
          ig.input.mouse.x,
          ig.input.mouse.y
        );
        this.mode = this.MODE.DEFAULT;
      } else if (this.activeLayer == this.entities) {
        this.undo.endEntityEdit();
      } else {
        if (this.activeLayer.isSelecting) {
          this.activeLayer.brush = this.activeLayer.endSelecting(
            ig.input.mouse.x,
            ig.input.mouse.y
          );
        } else {
          this.undo.endMapDraw();
        }
      }
    }

    if (action == "undo") {
      this.undo.undo();
    }

    if (action == "redo") {
      this.undo.redo();
    }

    this.draw();
    this.mouseLast = { x: ig.input.mouse.x, y: ig.input.mouse.y };
  }

  setTileOnCurrentLayer() {
    if (!this.activeLayer || !this.activeLayer.scroll) {
      return;
    }

    var co = this.activeLayer.getCursorOffset();
    var x = ig.input.mouse.x + this.activeLayer.scroll.x - co.x;
    var y = ig.input.mouse.y + this.activeLayer.scroll.y - co.y;

    var brush = this.activeLayer.brush;
    for (var by = 0; by < brush.length; by++) {
      var brushRow = brush[by];
      for (var bx = 0; bx < brushRow.length; bx++) {
        var mapx = x + bx * this.activeLayer.tilesize;
        var mapy = y + by * this.activeLayer.tilesize;

        var newTile = brushRow[bx];
        var oldTile = this.activeLayer.getOldTile(mapx, mapy);

        this.activeLayer.setTile(mapx, mapy, newTile);
        this.undo.pushMapDraw(this.activeLayer, mapx, mapy, oldTile, newTile);

        if (
          this.activeLayer.linkWithCollision &&
          this.collisionLayer &&
          this.collisionLayer != this.activeLayer
        ) {
          var collisionLayerTile = newTile > 0 ? this.collisionSolid : 0;

          var oldCollisionTile = this.collisionLayer.getOldTile(mapx, mapy);
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

  draw() {
    // The actual drawing loop is scheduled via ig.setAnimation() already.
    // We just set a flag to indicate that a redraw is needed.
    this.needsDraw = true;
  }

  drawIfNeeded() {
    // Only draw if flag is set
    if (!this.needsDraw) {
      return;
    }
    this.needsDraw = false;

    ig.system.clear(wm.config.colors.clear);

    var entitiesDrawn = false;
    for (var i = 0; i < this.layers.length; i++) {
      var layer = this.layers[i];

      // This layer is a foreground layer? -> Draw entities first!
      if (!entitiesDrawn && layer.foreground) {
        entitiesDrawn = true;
        this.entities.draw();
      }
      layer.draw();
    }

    if (!entitiesDrawn) {
      this.entities.draw();
    }

    if (this.activeLayer) {
      if (this.mode == this.MODE.TILESELECT) {
        this.activeLayer.tileSelect.draw();
        this.activeLayer.tileSelect.drawCursor(ig.input.mouse.x, ig.input.mouse.y);
      }

      if (this.mode == this.MODE.DEFAULT) {
        this.activeLayer.drawCursor(ig.input.mouse.x, ig.input.mouse.y);
      }
    }

    if (wm.config.labels.draw) {
      this.drawLabels(wm.config.labels.step);
    }
  }

  drawLabels(step) {
    ig.system.context.fillStyle = wm.config.colors.primary;
    var xlabel = this.screen.x - (this.screen.x % step) - step;
    for (var tx = Math.floor(-this.screen.x % step); tx < ig.system.width; tx += step) {
      xlabel += step;
      ig.system.context.fillText(xlabel, tx * ig.system.scale, 0);
    }

    var ylabel = this.screen.y - (this.screen.y % step) - step;
    for (var ty = Math.floor(-this.screen.y % step); ty < ig.system.height; ty += step) {
      ylabel += step;
      ig.system.context.fillText(ylabel, 0, ty * ig.system.scale);
    }
  }

  //#endregion Drawing

  getEntityByName(name) {
    return this.entities.getEntityByName(name);
  }
}

// Custom ig.Image class for use in LevelEditor. To make the zoom function
// work, we need some additional scaling behavior:
// Keep the original image, maintain a cache of scaled versions and use the
// default Canvas scaling (~bicubic) instead of nearest neighbor when
// zooming out.
ig.Image.inject({
  resize(scale) {
    if (!this.loaded) {
      return;
    }
    if (!this.scaleCache) {
      this.scaleCache = {};
    }
    if (this.scaleCache["x" + scale]) {
      this.data = this.scaleCache["x" + scale];
      return;
    }

    // Retain the original image when scaling
    this.origData = this.data = this.origData || this.data;

    if (scale > 1) {
      // Nearest neighbor when zooming in
      this.parent(scale);
    } else {
      // Otherwise blur
      var scaled = ig.$new("canvas");
      scaled.width = Math.ceil(this.width * scale);
      scaled.height = Math.ceil(this.height * scale);
      var scaledCtx = scaled.getContext("2d");
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
  },
});

// Create a custom loader, to skip sound files and the run loop creation
wm.Loader = ig.Loader.extend({
  end() {
    if (this.done) {
      return;
    }

    clearInterval(this._intervalId);
    this.done = true;
    ig.system.clear(wm.config.colors.clear);
    ig.game = new this.gameClass();
  },

  loadResource(res) {
    if (res instanceof ig.Sound) {
      this._unloaded.erase(res.path);
    } else {
      this.parent(res);
    }
  },
});

// Define a dummy module to load all plugins
ig.module("LevelEditor.loader")
  .requires.apply(ig, wm.config.plugins)
  .defines(function () {
    // Init!
    ig.system = new ig.System(
      "#canvas",
      1,
      Math.floor(LevelEditor.getMaxWidth() / wm.config.view.zoom),
      Math.floor(LevelEditor.getMaxHeight() / wm.config.view.zoom),
      wm.config.view.zoom
    );

    ig.input = new wm.EventedInput();
    ig.soundManager = new ig.SoundManager();
    ig.ready = true;

    var loader = new wm.Loader(wm.LevelEditor, ig.resources);
    loader.load();
  });
