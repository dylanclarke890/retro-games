import { constrain } from "../modules/lib/number-utils.js";
import { formatAsJSON, hyphenToCamelCase } from "../modules/lib/string-utils.js";
import { $el } from "../modules/lib/dom-utils.js";
import { slideToggle, fadeOut } from "../modules/lib/ui-effects.js";
import { getCookie, setCookie } from "../modules/lib/cookie.js";
import { Guard } from "../modules/lib/guard.js";

import { Register } from "../modules/core/register.js";
import { GameAudio } from "../modules/core/sound.js";
import { GameLoader } from "../modules/core/loader.js";
import { Input } from "../modules/core/input.js";

import { ModalDialog, ModalDialogPathSelect } from "./modal-dialogs.js";
import { SelectFileDropdown } from "./select-file-dropdown.js";
import { EditEntities } from "./edit-entities.js";
import { EditMap } from "./edit-map.js";
import { Undo } from "./undo.js";

export class LevelEditor {
  activeLayer = null;
  collisionLayer = null;
  collisionSolid = 1;
  config = null;
  deleteLayerDialog = null;
  /** @type {NodeListOf<Element>} */
  editorActionDisplays = null;
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
  MODE = {
    DEFAULT: 1,
    TILESELECT: 2,
    ENTITYSELECT: 4,
  };
  mode = this.MODE.DEFAULT;
  modified = false;
  mouseLast = { x: -1, y: -1 };
  needsDraw = true;
  /** @type {ModalDialogPathSelect} */
  saveDialog = null;
  undo = null;
  screen = {
    rounded: { x: 0, y: 0 },
    actual: { x: 0, y: 0 },
  };
  selectedEntity = null;
  /** @type {System} */
  system = null;
  tilesetSelectDialog = null;
  waitForModeChange = false;

  #rafId = null;

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
    this.editorActionDisplays = document.querySelectorAll(".editor-action");

    this.entities = new EditEntities({
      config: this.config,
      div: $el("#layerEntities"),
      editor: this,
      httpClient: this.httpClient,
      media: this.media,
      undo: this.undo,
      system: this.system,
    });

    // eslint-disable-next-line no-undef
    $("#layers").sortable({
      update: () => this.reorderLayers(),
    });
    // eslint-disable-next-line no-undef
    $("#layers").disableSelection();
    this.resetModified();

    this.bindEvents();

    if (config.loadLastLevel) {
      const path = getCookie("levelEditorLastLevel");
      if (path) this.load(null, path);
    }

    this.loadNew();
    requestAnimationFrame(() => this.drawIfNeeded());
  }

  /**
   * Init the pop up dialogs. Event listeners are bound in bindEvents().
   */
  initDialogs() {
    // Load level dropdown dialog.
    this.loadDialog = new ModalDialogPathSelect({
      text: "Load Level",
      okText: "Load",
      type: "scripts",
      httpClient: this.httpClient,
    });
    this.loadDialog.onOk = (dialog, path) => this.load(dialog, path);
    this.loadDialog.setPath(this.config.project.levelPath);

    // Save dialog.
    this.saveDialog = new ModalDialogPathSelect({
      text: "Save Level",
      okText: "Save",
      type: "scripts",
      httpClient: this.httpClient,
    });
    this.saveDialog.onOk = (dialog, path) => this.save(dialog, path);
    this.saveDialog.setPath(this.config.project.levelPath);

    // Lose changes confirmation.
    this.loseChangesDialog = new ModalDialog({ text: "Lose all changes?", autoInit: true });

    // Delete layer confirmation.
    this.deleteLayerDialog = new ModalDialog({
      text: "Delete Layer? NO UNDO!",
      autoInit: true,
    });
    this.deleteLayerDialog.onOk = () => this.removeLayer();

    // Select tile
    this.tilesetSelectDialog = new SelectFileDropdown({
      elementId: "#layerTileset",
      httpClient: this.httpClient,
      filetype: "images",
    });
  }

  bindEvents() {
    $el("#levelLoad").addEventListener("click", () => this.showLoadDialog());
    $el("#levelNew").addEventListener("click", () => this.showNewDialog());
    $el("#levelSaveAs").addEventListener("click", () => this.saveDialog.open());
    $el("#levelSave").addEventListener("click", () => this.saveQuick());

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
      // eslint-disable-next-line no-undef
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
    let returnValue = undefined;
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
    const { actual, rounded } = this.screen;
    actual.x -= x;
    actual.y -= y;
    rounded.x = Math.round(actual.x * scale) / scale;
    rounded.y = Math.round(actual.y * scale) / scale;
    for (let i = 0; i < this.layers.length; i++) this.layers[i].setScreenPos(actual.x, actual.y);
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
    let z = config.view.zoom;
    const mx = this.input.mouse.x * z,
      my = this.input.mouse.y * z;

    if (z <= 1) {
      if (delta < 0) z /= 2;
      else z *= 2;
    } else z += delta;

    config.view.zoom = constrain(z, config.view.zoomMin, config.view.zoomMax);
    config.labels.step = Math.round(this.labelsStep / config.view.zoom);

    const zoomDisplay = $el("#zoomIndicator");
    zoomDisplay.textContent = `${config.view.zoom}x`;
    zoomDisplay.style.display = "block";
    setTimeout(() => fadeOut(zoomDisplay), 300);

    // Adjust mouse pos and screen coordinates
    this.input.mouse.x = mx / config.view.zoom;
    this.input.mouse.y = my / config.view.zoom;
    this.drag();

    const assets = Register.getAssetCacheEntries(GameAudio); // We don't need to resize audio.
    assets.forEach((a) => a.resize(config.view.zoom));
    this.resize();
  }

  //#region Loading

  loadNew() {
    setCookie("levelEditorLastLevel", null);
    while (this.layers.length) {
      this.layers[0].destroy();
      this.layers.splice(0, 1);
    }
    this.screen.actual = { x: 0, y: 0 };
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
    this.httpClient.api.file(path, { parseResponse: false }).then((data) => this.parseData(data));
  }

  parseData(data) {
    if (!data) {
      console.debug("LevelEditor: parseData - no data provided.");
      return;
    }

    // extract JS object from level data.
    const jsonMatch = data.match(/\/\*JSON-BEGIN\*\/\s?([\s\S]*?);?\s?\/\*JSON-END\*/);
    if (jsonMatch) {
      let json = jsonMatch[1];
      // Some keys may be stored in modern JS format i.e without quotes. Find and replace them.
      const matches = json.match(/(\w+):/g);
      if (matches) {
        matches.forEach((v) => {
          // v = match + : - we want it to be "match":
          const match = v.substring(0, v.length - 1);
          json = json.replace(v, `"${match}":`);
        });
      }

      // Remove all trailing commas on arrays and objects.
      json = json.replace(/,(?=\s*[}|\]])/gm, "");

      // Finally, we can parse it:
      data = JSON.parse(json);
    }

    this.levelData = data;
    this.loadFromData(data);
  }

  loadFromData(data) {
    if (!data) {
      console.debug("LevelEditor: loadFromData - no data provided.");
      return;
    }
    setCookie("levelEditorLastLevel", this.filePath);

    while (this.layers.length) {
      this.layers[0].destroy();
      this.layers.splice(0, 1);
    }
    this.screen.actual = { x: 0, y: 0 };
    this.entities.clear();

    for (let i = 0; i < data.entities.length; i++) {
      const entity = data.entities[i];
      this.entities.spawnEntity(entity.type, entity.x, entity.y, entity.settings);
    }

    for (let i = 0; i < data.layer.length; i++) {
      const layer = data.layer[i];
      const newLayer = new EditMap({
        name: layer.name,
        tilesize: layer.tilesize,
        tileset: layer.tilesetName || layer.tileset,
        foreground: !!layer.foreground,
        system: this.system,
        config: this.config,
        editor: this,
      });
      newLayer.resize(layer.width || layer.data[0].length, layer.height || layer.data.length);
      newLayer.linkWithCollision = layer.linkWithCollision;
      newLayer.repeat = layer.repeat;
      newLayer.preRender = !!layer.preRender;
      newLayer.distance = layer.distance;
      newLayer.visible = !layer.visible;
      newLayer.data = layer.data;
      newLayer.toggleVisibility();
      this.layers.push(newLayer);

      if (layer.name === "collision") this.collisionLayer = newLayer;
      this.setActiveLayer(layer.name);
    }

    this.setActiveLayer("entities");

    this.reorderLayers();
    // eslint-disable-next-line no-undef
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

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      data.layer.push(layer.getSaveData());
    }

    let dataString = JSON.stringify(data);
    if (this.config.project.prettyPrint) dataString = formatAsJSON(dataString);
    const levelName = hyphenToCamelCase(this.fileName.substring(0, this.fileName.lastIndexOf(".")));
    dataString = `export const ${levelName} = /*JSON-BEGIN*/ ${dataString}; /*JSON-END*/`;

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
      editor: this,
    });
    newLayer.resize(this.config.layerDefaults.width, this.config.layerDefaults.height);
    newLayer.setScreenPos(this.screen.actual.x, this.screen.actual.y);
    this.layers.push(newLayer);
    this.setActiveLayer(name);
    this.updateLayerSettings();
    this.reorderLayers();
    // eslint-disable-next-line no-undef
    $("#layers").sortable("refresh");
  }

  removeLayer() {
    const name = this.activeLayer.name;
    if (name === "entities") return false;
    this.activeLayer.destroy();
    for (let i = 0; i < this.layers.length; i++) {
      if (this.layers[i].name !== name) continue;
      this.layers.splice(i, 1);
      this.reorderLayers();
      // eslint-disable-next-line no-undef
      $("#layers").sortable("refresh");
      this.setActiveLayer("entities");
      return true;
    }
    return false;
  }

  getLayerWithName(name) {
    return this.layers.find((layer) => layer.name === name);
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

    const layerSettings = $el("#layerSettings");
    if (name === "entities") layerSettings.style.display = "none";
    else {
      layerSettings.style.display = "block";
      this.entities.selectEntity(null);
      this.toggleCollisionLayer();
      this.updateLayerSettings();
    }
    this.draw();
  }

  toggleCollisionLayer() {
    const isCollision = $el("#layerIsCollision").checked;
    [
      "#layerName",
      "#layerRepeat",
      "#layerTileset",
      "#layerDistance",
      "#layerPreRender",
      "#layerLinkWithCollision",
    ].forEach((v) => ($el(v).disabled = isCollision));
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
          const x = this.input.mouse.x + this.screen.actual.x;
          const y = this.input.mouse.y + this.screen.actual.y;
          this.entities.dragOnSelectedEntity(x, y);
          this.setModified();
        }

        // draw on map
        else if (!this.activeLayer.isSelecting) this.setTileOnCurrentLayer();
      } else if (this.activeLayer === this.entities) {
        const x = this.input.mouse.x + this.screen.actual.x;
        const y = this.input.mouse.y + this.screen.actual.y;
        this.entities.mousemove(x, y);
      }
    }

    this.mouseLast = { ...this.input.mouse };
    this.draw();
  }

  displayAction(action) {
    action = action.toUpperCase();
    this.editorActionDisplays.forEach((v) => (v.textContent = action));
  }

  keydown(action) {
    if (!this.activeLayer) return;

    if (action !== "draw") {
      this.draw();
      return;
    }

    if (this.mode === this.MODE.TILESELECT && this.input.state("select")) {
      this.activeLayer.tileSelect.beginSelecting(this.input.mouse.x, this.input.mouse.y);
      this.draw();
      return;
    }

    if (this.mode !== this.MODE.DEFAULT) {
      this.draw();
      return;
    }

    // select entity
    if (this.activeLayer === this.entities) {
      const x = this.input.mouse.x + this.screen.actual.x;
      const y = this.input.mouse.y + this.screen.actual.y;
      const entity = this.entities.selectEntityAt(x, y);
      if (entity) this.undo.beginEntityEdit(entity);
      this.draw();
      return;
    }

    // layer select
    if (this.input.state("select")) {
      this.activeLayer.beginSelecting(this.input.mouse.x, this.input.mouse.y);
      this.draw();
      return;
    }

    // drawing map
    this.undo.beginMapDraw();
    this.activeLayer.beginEditing();
    // update collision map too if linked.
    if (
      this.activeLayer.linkWithCollision &&
      this.collisionLayer &&
      this.collisionLayer !== this.activeLayer
    ) {
      this.collisionLayer.beginEditing();
    }
    this.setTileOnCurrentLayer();

    this.draw();
  }

  keyup(action) {
    if (!this.activeLayer) return;

    switch (action) {
      case "drag": // handled by drag()
      case "select": // handled by keydown()
        break;
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

  // eslint-disable-next-line no-unused-vars
  drawIfNeeded(_timestamp) {
    this.#rafId = requestAnimationFrame((t) => this.drawIfNeeded(t));
    if (!this.needsDraw) return; // Only draw if flag is set
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

  stopDrawing() {
    cancelAnimationFrame(this.#rafId);
    this.needsDraw = false;
  }

  drawLabels(step) {
    const { ctx, height, width, scale } = this.system;
    ctx.fillStyle = this.config.colors.primary;
    let xlabel = this.screen.actual.x - (this.screen.actual.x % step) - step;
    for (let tx = Math.floor(-this.screen.actual.x % step); tx < width; tx += step) {
      xlabel += step;
      ctx.fillText(xlabel, tx * scale, 0);
    }

    let ylabel = this.screen.actual.y - (this.screen.actual.y % step) - step;
    for (let ty = Math.floor(-this.screen.actual.y % step); ty < height; ty += step) {
      ylabel += step;
      ctx.fillText(ylabel, 0, ty * scale);
    }
  }

  //#endregion Drawing
}

/** Custom loader, used to skip sound files and the run loop creation. */
export class LevelEditorLoader extends GameLoader {
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
