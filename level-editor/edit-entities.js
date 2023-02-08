import { Guard } from "../modules/lib/guard.js";
import { $el, $new, loadScript } from "../modules/lib/dom-utils.js";

import { Register } from "../modules/core/register.js";
import { Game } from "../modules/core/game.js";
import { removeItem } from "../modules/lib/array-utils.js";

export class EditEntities {
  active = true;
  config = null;
  div = null;
  entities = [];
  entityClasses = {};
  entityDefinitions = null;
  game = null;
  gridSize = 0;
  hotkey = -1;
  httpClient = null;
  ignoreLastClick = false;
  menu = null;
  name = "entities";
  namedEntities = {};
  selectedEntity = null;
  selector = { size: { x: 2, y: 2 }, pos: { x: 0, y: 0 }, offset: { x: 0, y: 0 } };
  undo = null;
  visible = true;
  wasSelectedOnScaleBorder = false;

  get screen() {
    return this.editor.screen;
  }

  constructor({ div, config, undo, editor, httpClient, media, system } = {}) {
    Guard.againstNull({ div });
    Guard.againstNull({ config });
    Guard.againstNull({ undo });
    Guard.againstNull({ editor });
    Guard.againstNull({ httpClient });
    Guard.againstNull({ media });
    Guard.againstNull({ system });

    this.config = config;
    this.div = div;
    this.editor = editor;
    this.httpClient = httpClient;
    this.undo = undo;
    this.media = media;
    this.system = system;

    div.addEventListener("mouseup", () => this.click());
    div.querySelector(".visible").addEventListener("mousedown", () => this.toggleVisibilityClick());
    this.gridSize = config.entityGrid;

    this.menu = $el("#entityMenu");
    this.entityDefinitions = $el("#entityDefinitions");

    const entityKey = $el("#entityKey");
    entityKey.addEventListener("keydown", (e) => {
      // Tab over to the value on enter press.
      if (e.key === "Enter") $el("#entityValue").focus();
    });
    const entityValue = $el("#entityValue");
    entityValue.addEventListener("keydown", (e) => this.setEntitySetting(e));

    this.loadEntities().then((entitiesData) => this.loadEntityScripts(entitiesData));
  }

  createAnimationSheet({ path, size }) {
    return this.media.createAnimationSheet({ path, size });
  }

  clear() {
    this.entities = [];
    this.selectEntity(null);
  }

  sort() {
    this.entities.sort(Game.SORT.Z_INDEX);
  }

  //#region Saving/Loading

  async loadEntities() {
    return await this.httpClient.api.glob(this.config.project.entityFiles);
  }

  loadEntityScripts(entitiesData) {
    let totalScriptsToLoad = Object.keys(entitiesData).length;
    const scriptLoadCb = () => {
      if (--totalScriptsToLoad <= 0) this.importEntities(entitiesData);
    };
    for (let filepath in entitiesData) loadScript({ src: filepath, cb: scriptLoadCb });
  }

  importEntities(entitiesData) {
    const invalidClasses = [];
    for (let filepath in entitiesData) {
      for (let i = 0; i < entitiesData[filepath].length; i++) {
        const className = entitiesData[filepath][i];
        const entityName = className.replace(/^Entity/, "");
        const classDef = Register.getEntityByType(className);
        if (!classDef) {
          invalidClasses.push(className);
          continue;
        }

        if (classDef.prototype._levelEditorIgnore) continue;
        const entityDiv = $new("div");
        entityDiv.id = className;
        entityDiv.textContent = entityName;
        entityDiv.addEventListener("mouseup", (e) => this.newEntityClick(e));
        this.menu.append(entityDiv);
        this.entityClasses[className] = filepath;
        new classDef({ x: 0, y: 0, game: this }); // images are already loaded but need caching.
      }
    }

    if (invalidClasses.length > 0) {
      console.debug(`Entity class definitions could not be fetched. Please ensure you've correctly
      registered the entity type by calling Register.entityType(classDefinition) or
      Register.entityTypes(...classDefinitions): ${invalidClasses.join("\n")}`);
    }
  }

  getEntityByName(name) {
    return this.namedEntities[name];
  }

  getSaveData() {
    const entitiesToSave = [];
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      const type = entity.constructor.name;
      const data = { type, ...entity.pos };
      if (entity._additionalSettings) data.settings = entity._additionalSettings;
      entitiesToSave.push(data);
    }
    return entitiesToSave;
  }

  //#endregion Saving/Loading

  //#region Selecting

  selectEntityAt(x, y) {
    this.selector.pos = { x, y };

    // Find all possible selections
    const possibleSelections = [];
    for (let i = 0; i < this.entities.length; i++)
      if (this.entities[i].touches(this.selector)) possibleSelections.push(this.entities[i]);

    if (!possibleSelections.length) {
      this.selectEntity(null);
      return;
    }

    // Find the 'next' selection
    const selectedIndex = possibleSelections.indexOf(this.selectedEntity);
    const nextSelection = (selectedIndex + 1) % possibleSelections.length;
    const entity = possibleSelections[nextSelection];

    // Select it!
    x = x - entity.pos.x + entity.offset.x;
    y = y - entity.pos.y + entity.offset.y;
    this.selector.offset = { x, y };
    this.selectEntity(entity);
    this.wasSelectedOnScaleBorder = this.isOnScaleBorder(entity, this.selector);
    return entity;
  }

  selectEntity(entity) {
    const entityKey = $el("#entityKey");
    const entityValue = $el("#entityValue");
    const entitySettings = $el("#entitySettings");

    if (!entity) {
      entitySettings.style.display = "none";
      entityKey.blur();
      entityValue.blur();
      this.selectedEntity = null;
      return;
    }

    if (entity !== this.selectedEntity) {
      this.selectedEntity = entity;
      this.loadEntitySettings();

      entitySettings.style.display = "block";
      entityKey.value = "";
      entityValue.value = "";
      return;
    }
  }

  //#endregion Selecting

  //#region Creating, Deleting, Moving

  deleteSelectedEntity() {
    if (!this.selectedEntity) return false;
    this.undo.commitEntityDelete(this.selectedEntity);
    this.removeEntity(this.selectedEntity);
    this.selectEntity(null);
    return true;
  }

  removeEntity(entity) {
    if (entity.name) delete this.namedEntities[entity.name];
    removeItem(this.entities, entity);
  }

  cloneSelectedEntity() {
    if (!this.selectedEntity) return false;
    const className = this.selectedEntity.constructor.name;
    const settings = Object.assign({}, this.selectedEntity._additionalSettings);
    if (settings.name) settings.name = settings.name + "_clone";
    const x = this.selectedEntity.pos.x + this.gridSize;
    const y = this.selectedEntity.pos.y;
    const newEntity = this.spawnEntity(className, x, y, settings);
    newEntity._additionalSettings = settings;
    this.selectEntity(newEntity);
    this.undo.commitEntityCreate(newEntity);
    return true;
  }

  dragOnSelectedEntity(x, y) {
    if (!this.selectedEntity) return false;

    if (this.selectedEntity._levelEditorIsScalable && this.wasSelectedOnScaleBorder)
      this.scaleSelectedEntity(x, y);
    else this.moveSelectedEntity(x, y);

    this.undo.pushEntityEdit(this.selectedEntity);
    return true;
  }

  moveSelectedEntity(x, y) {
    x =
      Math.round((x - this.selector.offset.x) / this.gridSize) * this.gridSize +
      this.selectedEntity.offset.x;
    y =
      Math.round((y - this.selector.offset.y) / this.gridSize) * this.gridSize +
      this.selectedEntity.offset.y;
    if (this.selectedEntity.pos.x === x && this.selectedEntity.pos.y === y) return;

    $el("#position-x").textContent = x;
    $el("#position-y").textContent = y;
    this.selectedEntity.pos.x = x;
    this.selectedEntity.pos.y = y;
  }

  scaleSelectedEntity(x, y) {
    const scaleDir = this.wasSelectedOnScaleBorder;
    let w, h;
    if (!this.selectedEntity._additionalSettings.size)
      this.selectedEntity._additionalSettings.size = {};

    switch (scaleDir) {
      case "n":
        h = this.selectedEntity.pos.y - Math.round(y / this.gridSize) * this.gridSize;
        if (this.selectedEntity.size.y + h <= this.gridSize)
          h = (this.selectedEntity.size.y - this.gridSize) * -1;
        this.selectedEntity.size.y += h;
        this.selectedEntity.pos.y -= h;
        break;
      case "s":
        h = Math.round(y / this.gridSize) * this.gridSize - this.selectedEntity.pos.y;
        this.selectedEntity.size.y = Math.max(this.gridSize, h);
        break;
      case "e":
        w = Math.round(x / this.gridSize) * this.gridSize - this.selectedEntity.pos.x;
        this.selectedEntity.size.x = Math.max(this.gridSize, w);
        break;
      case "w":
        w = this.selectedEntity.pos.x - Math.round(x / this.gridSize) * this.gridSize;
        if (this.selectedEntity.size.x + w <= this.gridSize)
          w = (this.selectedEntity.size.x - this.gridSize) * -1;
        this.selectedEntity.size.x += w;
        this.selectedEntity.pos.x -= w;
        break;
      default:
        throw new Error(`Unrecognised direction: ${scaleDir}`);
    }

    this.selectedEntity._additionalSettings.size.x = this.selectedEntity.size.x;
    this.selectedEntity._additionalSettings.size.y = this.selectedEntity.size.y;
    this.loadEntitySettings();
  }

  newEntityClick(ev) {
    this.hideMenu();
    const newEntity = this.spawnEntity(ev.target.id, 0, 0, {});
    this.selectEntity(newEntity);
    this.moveSelectedEntity(this.selector.pos.x, this.selector.pos.y);
    this.editor.setModified();
    this.undo.commitEntityCreate(newEntity);
    this.editor.draw();
  }

  spawnEntity(className, x, y, settings = {}) {
    const entityClass = Register.getEntityByType(className);
    if (!entityClass) return null;
    const newEntity = new entityClass({ x, y, game: this, settings });
    newEntity._additionalSettings = {};
    for (let s in settings) newEntity._additionalSettings[s] = settings[s];
    this.entities.push(newEntity);
    if (settings.name) this.namedEntities[settings.name] = newEntity;
    this.sort();
    return newEntity;
  }

  isOnScaleBorder(entity, selector) {
    const border = 2;
    const w = selector.pos.x - entity.pos.x;
    const h = selector.pos.y - entity.pos.y;
    if (w < border) return "w";
    if (w > entity.size.x - border) return "e";
    if (h < border) return "n";
    if (h > entity.size.y - border) return "s";
    return false;
  }

  //#endregion Creating, Deleting, Moving

  //#region Settings

  loadEntitySettings() {
    if (!this.selectedEntity) return;

    const defaultEls = document.querySelectorAll(".default");
    this.entityDefinitions.innerHTML = "";

    defaultEls.forEach((v) => this.entityDefinitions.appendChild(v));

    $el("#position-x").textContent = this.selectedEntity.pos.x;
    $el("#position-y").textContent = this.selectedEntity.pos.y;

    const html = this.loadEntitySettingsRecursive(this.selectedEntity._additionalSettings);
    this.entityDefinitions.innerHTML += html;

    const className = this.selectedEntity.constructor.name.replace(/^Entity/, "");
    $el("#entityClass").textContent = className;

    const entityDefinitionElements = document.getElementsByClassName("entityDefinition");
    for (let i = 0; i < entityDefinitionElements.length; i++) {
      const element = entityDefinitionElements[i];
      element.addEventListener("mouseup", () => this.selectEntitySetting(element));
    }
  }

  loadEntitySettingsRecursive(settings, path = "") {
    let html = "";
    for (let key in settings) {
      const value = settings[key];
      if (typeof value === "object")
        html += this.loadEntitySettingsRecursive(value, path + key + ".");
      else {
        html += `
          <div class="entityDefinition">
            <span class="key">${path}${key}</span>:
            <span class="value">${value}</span>
          </div>
          `;
      }
    }

    return html;
  }

  setEntitySetting(ev) {
    if (ev.which !== 13) return true;
    const eKey = $el("#entityKey");
    const eVal = $el("#entityValue");
    const key = eKey.value;
    let value = eVal.value;
    const floatVal = parseFloat(value);

    if (!Number.isNaN(floatVal)) value = floatVal;
    if (key === "name") {
      if (this.selectedEntity.name) delete this.namedEntities[this.selectedEntity.name];
      this.namedEntities[value] = this.selectedEntity;
    }

    if (key === "x") this.selectedEntity.pos.x = Math.round(value);
    else if (key === "y") this.selectedEntity.pos.y = Math.round(value);
    else {
      this.writeSettingAtPath(this.selectedEntity._additionalSettings, key, value);
      Object.assign(this.selectedEntity, this.selectedEntity._additionalSettings);
    }

    this.sort();

    this.editor.setModified();
    this.editor.draw();

    eKey.value = "";
    eVal.value = "";
    eVal.blur();
    this.loadEntitySettings();
    eKey.focus();
    return false;
  }

  writeSettingAtPath(root, path, value) {
    path = path.split(".");
    let current = root;
    for (let i = 0; i < path.length; i++) {
      const n = path[i];
      if (i < path.length - 1 && typeof current[n] !== "object") current[n] = {};
      if (i === path.length - 1) current[n] = value;
      current = current[n];
    }

    this.trimObject(root);
  }

  trimObject(obj) {
    let isEmpty = true;
    for (let i in obj) {
      if (obj[i] === "" || (typeof obj[i] == "object" && this.trimObject(obj[i]))) delete obj[i];
      if (typeof obj[i] !== "undefined") isEmpty = false;
    }

    return isEmpty;
  }

  selectEntitySetting(element) {
    const entityKey = $el("#entityKey");
    const entityVal = $el("#entityValue");
    entityKey.value = element.querySelector(".key").textContent;
    entityVal.value = element.querySelector(".value").textContent;
    entityVal.dispatchEvent(new Event("select"));
  }

  //#region Settings

  //#region UI

  setHotkey(hotkey) {
    this.hotkey = hotkey;
    this.div.title = `Select Layer (${this.hotkey})`;
  }

  showMenu(x, y) {
    const { scale } = this.system;
    this.selector.pos = {
      x: Math.round((x + this.screen.actual.x) / this.gridSize) * this.gridSize,
      y: Math.round((y + this.screen.actual.y) / this.gridSize) * this.gridSize,
    };
    this.menu.style.top = `${y * scale + 2}px`;
    this.menu.style.left = `${x * scale + 2}px`;
    this.menu.style.display = "block";
  }

  hideMenu() {
    this.editor.mode = this.editor.MODE.DEFAULT;
    this.menu.style.display = "none";
  }

  setActive(active) {
    this.active = !!active;
    this.div.classList.toggle("layerActive", this.active);
  }

  toggleVisibility() {
    this.visible = !this.visible;
    const visibleEl = this.div.querySelector(".visible");
    visibleEl.classList.toggle("checkedVis", this.visible);
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
    this.editor.setActiveLayer("entities");
  }

  mousemove(x, y) {
    this.selector.pos = { x, y };

    if (
      !this.selectedEntity ||
      !(this.selectedEntity._levelEditorIsScalable && this.selectedEntity.touches(this.selector))
    ) {
      document.body.style.cursor = "default";
      return;
    }

    const scaleDir = this.isOnScaleBorder(this.selectedEntity, this.selector);
    if (scaleDir === "n" || scaleDir === "s") document.body.style.cursor = "ns-resize";
    else if (scaleDir === "e" || scaleDir === "w") document.body.style.cursor = "ew-resize";
  }

  //#region UI

  //#region Drawing

  draw() {
    if (!this.visible) return;
    for (let i = 0; i < this.entities.length; i++) this.drawEntity(this.entities[i]);
  }

  drawEntity(entity) {
    // entity itself
    entity.draw();

    const { scale, ctx, drawPosition } = this.system;
    // box
    if (entity._levelEditorDrawBox) {
      ctx.fillStyle = entity._levelEditorBoxColor || "rgba(128, 128, 128, 0.9)";
      ctx.fillRect(
        drawPosition(entity.pos.x - this.editor.screen.rounded.x),
        drawPosition(entity.pos.y - this.editor.screen.rounded.y),
        entity.size.x * scale,
        entity.size.y * scale
      );
    }

    if (this.config.labels.draw) {
      // description
      const className = entity.constructor.name.replace(/^Entity/, "");
      const description = className + (entity.name ? `" ${entity.name}` : "");

      // text-shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillText(
        description,
        drawPosition(entity.pos.x - this.editor.screen.x),
        drawPosition(entity.pos.y - this.editor.screen.y + 0.5)
      );

      // text
      ctx.fillStyle = this.config.colors.primary;
      ctx.fillText(
        description,
        drawPosition(entity.pos.x - this.editor.screen.x),
        drawPosition(entity.pos.y - this.editor.screen.y)
      );
    }

    // line to targets
    if (typeof entity.target !== "object") return;
    for (let t in entity.target) this.drawLineToTarget(entity, entity.target[t]);
  }

  drawLineToTarget(ent, target) {
    target = this.getEntityByName(target);
    if (!target) return;

    const { ctx, drawPosition } = this.system;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(
      drawPosition(ent.pos.x + ent.size.x / 2 - this.editor.screen.x),
      drawPosition(ent.pos.y + ent.size.y / 2 - this.editor.screen.y)
    );
    ctx.lineTo(
      drawPosition(target.pos.x + target.size.x / 2 - this.editor.screen.x),
      drawPosition(target.pos.y + target.size.y / 2 - this.editor.screen.y)
    );
    ctx.stroke();
    ctx.closePath();
  }

  // eslint-disable-next-line no-unused-vars
  drawCursor(_x, _y) {
    if (!this.selectedEntity) return;
    const { ctx, drawPosition, scale } = this.system;
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.config.colors.highlight;
    ctx.strokeRect(
      drawPosition(this.selectedEntity.pos.x - this.editor.screen.x) - 0.5,
      drawPosition(this.selectedEntity.pos.y - this.editor.screen.y) - 0.5,
      this.selectedEntity.size.x * scale + 1,
      this.selectedEntity.size.y * scale + 1
    );
  }

  //#endregion Drawing
}
