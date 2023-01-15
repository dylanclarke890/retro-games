class EditEntities {
  visible = true;
  active = true;

  div = null;
  hotkey = -1;
  ignoreLastClick = false;
  name = "entities";

  entities = [];
  namedEntities = {};
  selectedEntity = null;
  entityClasses = {};
  menu = null;
  selector = { size: { x: 2, y: 2 }, pos: { x: 0, y: 0 }, offset: { x: 0, y: 0 } };
  wasSelectedOnScaleBorder = false;
  gridSize = wm.config.entityGrid; // TODO
  entityDefinitions = null;

  constructor(div) {
    this.div = div;
    div.addEventListener("mouseup", () => this.click());
    div.querySelector(".visible").addEventListener("mousedown", () => this.toggleVisibilityClick());

    this.menu = $new("div");
    this.menu.id = "entityMenu";
    this.importEntityClass(wm.entityModules); // TODO
    this.entityDefinitions = $new("div");
    this.entityDefinitions.id = "entityDefinitions";

    // TODO
    const entityKey = $el("#entityKey");
    entityKey.addEventListener("keydown", (e) => {
      if (e.which == 13) {
        // TODO
        $el("#entityValue").focus();
        return false;
      }
      return true;
    });
    const entityValue = $el("#entityValue");
    entityValue.addEventListener("keydown", (e) => this.setEntitySetting(e));
  }

  clear() {
    this.entities = [];
    this.selectEntity(null);
  }

  sort() {
    this.entities.sort(Game.SORT.Z_INDEX);
  }

  //#region Saving/Loading

  // TODO!
  fileNameToClassName(name) {
    const typeName = "-" + name.replace(/^.*\/|\.js/g, "");
    typeName = typeName.replace(/-(\w)/g, function (m, a) {
      return a.toUpperCase();
    });
    return "Entity" + typeName;
  }

  //TODO
  importEntityClass(modules) {
    const unloadedClasses = [];
    for (let m in modules) {
      const className = this.fileNameToClassName(modules[m]);
      const entityName = className.replace(/^Entity/, "");
      const classDef = Register.getEntityByType(className);

      if (classDef) {
        // Ignore entities that have the _wmIgnore flag
        if (!classDef.prototype._wmIgnore) {
          const a = $new("div");
          a.id = className;
          a.href = "#";
          a.textContent = entityName;
          a.addEventListener("mouseup", (e) => this.newEntityClick(e));
          this.menu.append(a);
          this.entityClasses[className] = m;
        }
      } else unloadedClasses.push(modules[m] + " (expected name: " + className + ")");
    }

    if (unloadedClasses.length > 0) {
      alert(`"The following entity classes were not loaded due to\nfile and class name mismatches: \n\n
        ${unloadedClasses.join("\n")}`);
    }
  }

  getEntityByName(name) {
    return this.namedEntities[name];
  }

  getSaveData() {
    const entitiesToSave = [];
    for (const i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      const type = ent._wmClassName;
      const data = { type: type, x: ent.pos.x, y: ent.pos.y };
      if (ent._wmSettings) data.settings = ent._wmSettings;
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
    if (entity && entity !== this.selectedEntity) {
      this.selectedEntity = entity;
      //TODO
      $el("#entitySettings").fadeOut(
        100,
        function () {
          this.loadEntitySettings();
          $("#entitySettings").fadeIn(100);
        }.bind(this)
      );
    } else if (!entity) {
      $el("#entitySettings").fadeOut(100);
      entityKey.blur();
      entityValue.blur();
    }

    this.selectedEntity = entity;
    // TODO - check
    entityKey.value = "";
    entityValue.value = "";
  }

  //#endregion Selecting

  //#region Creating, Deleting, Moving

  deleteSelectedEntity() {
    if (!this.selectedEntity) return false;
    ig.game.undo.commitEntityDelete(this.selectedEntity); // TODO
    this.removeEntity(this.selectedEntity);
    this.selectEntity(null);
    return true;
  }

  removeEntity(ent) {
    if (ent.name) delete this.namedEntities[ent.name];
    this.entities.erase(ent);
  }

  cloneSelectedEntity() {
    if (!this.selectedEntity) return false;
    const className = this.selectedEntity._wmClassName;
    const settings = NativeExtensions.copy(this.selectedEntity._wmSettings);
    if (settings.name) settings.name = settings.name + "_clone";
    const x = this.selectedEntity.pos.x + this.gridSize;
    const y = this.selectedEntity.pos.y;
    const newEntity = this.spawnEntity(className, x, y, settings);
    newEntity._wmSettings = settings;
    this.selectEntity(newEntity);
    ig.game.undo.commitEntityCreate(newEntity); // TODO
    return true;
  }

  dragOnSelectedEntity(x, y) {
    if (!this.selectedEntity) return false;

    if (this.selectedEntity._wmScalable && this.wasSelectedOnScaleBorder)
      this.scaleSelectedEntity(x, y);
    else this.moveSelectedEntity(x, y);

    ig.game.undo.pushEntityEdit(this.selectedEntity); // TODO
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

    $el("#entityDefinitionPosX").textContent = x;
    $el("#entityDefinitionPosY").textContent = x;
    this.selectedEntity.pos.x = x;
    this.selectedEntity.pos.y = y;
  }

  scaleSelectedEntity(x, y) {
    const scaleDir = this.wasSelectedOnScaleBorder;
    let w = Math.round(x / this.gridSize) * this.gridSize - this.selectedEntity.pos.x;
    let h;
    if (!this.selectedEntity._wmSettings.size) this.selectedEntity._wmSettings.size = {};

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

    this.selectedEntity._wmSettings.size.x = this.selectedEntity.size.x;
    this.selectedEntity._wmSettings.size.y = this.selectedEntity.size.y;
    this.loadEntitySettings();
  }

  newEntityClick(ev) {
    this.hideMenu();
    const newEntity = this.spawnEntity(ev.target.id, 0, 0, {});
    this.selectEntity(newEntity);
    this.moveSelectedEntity(this.selector.pos.x, this.selector.pos.y);
    ig.editor.setModified(); // TODO
    ig.game.undo.commitEntityCreate(newEntity);
  }

  spawnEntity(className, x, y, settings = {}) {
    const entityClass = Register.getEntityByType(className);
    if (!entityClass) return null;

    const newEntity = new entityClass(x, y, settings);
    newEntity._wmInEditor = true;
    newEntity._wmClassName = className;
    newEntity._wmSettings = {};
    for (let s in settings) newEntity._wmSettings[s] = settings[s];
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
    let html = `
      <div class="entityDefinition">
        <span class="key">x</span>:
        <span class="value" id="entityDefinitionPosX">${this.selectedEntity.pos.x}</span>
      </div>
      <div class="entityDefinition">
        <span class="key">y</span>:
        <span class="value" id="entityDefinitionPosY">${this.selectedEntity.pos.y}</span>
    `;

    html += this.loadEntitySettingsRecursive(this.selectedEntity._wmSettings);
    this.entityDefinitions.innerHTML = html;

    const className = this.selectedEntity._wmClassName.replace(/^Entity/, "");
    $el("#entityClass").textContent = className;

    const entityDefinitionElements = document.getElementsByClassName("entityDefinition");
    for (let i = 0; i < entityDefinitionElements.length; i++) {
      const element = entityDefinitionElements[i];
      element.addEventListener("mouseup", (e) => this.selectEntitySetting(element));
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
    const value = eVal.value;
    const floatVal = parseFloat(value);

    if (value == floatVal) value = floatVal;
    if (key === "name") {
      if (this.selectedEntity.name) delete this.namedEntities[this.selectedEntity.name];
      this.namedEntities[value] = this.selectedEntity;
    }

    if (key === "x") this.selectedEntity.pos.x = Math.round(value);
    else if (key === "y") this.selectedEntity.pos.y = Math.round(value);
    else {
      this.writeSettingAtPath(this.selectedEntity._wmSettings, key, value);
      NativeExtensions.extend(this.selectedEntity, this.selectedEntity._wmSettings);
    }

    this.sort();

    ig.game.setModified(); // TODO
    ig.game.draw();

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
    const { scale } = this.system; // TODO
    // TODO
    this.selector.pos = {
      x: Math.round((x + ig.editor.screen.x) / this.gridSize) * this.gridSize,
      y: Math.round((y + ig.editor.screen.y) / this.gridSize) * this.gridSize,
    };
    this.menu.style.top = `${y * scale + 2}px`;
    this.menu.style.left = `${x * scale + 2}px`;
    this.menu.style.display = "block";
    this.menu.show();
  }

  hideMenu() {
    // TODO
    ig.editor.mode = ig.editor.MODE.DEFAULT;
    this.menu.style.display = "none";
  }

  setActive(active) {
    this.active = active;
    if (active) this.div.classList.add("layerActive");
    else this.div.classList.remove("layerActive");
  }

  toggleVisibility() {
    this.visible ^= 1;
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
    ig.editor.setActiveLayer("entities"); // TODO
  }

  mousemove(x, y) {
    this.selector.pos = { x: x, y: y };

    if (
      !this.selectedEntity ||
      !(this.selectedEntity._wmScalable && this.selectedEntity.touches(this.selector))
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
    if (entity._wmDrawBox) {
      ctx.fillStyle = entity._wmBoxColor || "rgba(128, 128, 128, 0.9)";
      // TODO
      ctx.fillRect(
        drawPosition(entity.pos.x - ig.game.screen.x), // TODO
        drawPosition(entity.pos.y - ig.game.screen.y),
        entity.size.x * scale,
        entity.size.y * scale
      );
    }

    if (this.config.labels.draw) {
      // description
      const className = entity._wmClassName.replace(/^Entity/, "");
      const description = className + (entity.name ? ": " + entity.name : "");

      // text-shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillText(
        description,
        drawPosition(entity.pos.x - ig.game.screen.x),
        drawPosition(entity.pos.y - ig.game.screen.y + 0.5) // TODO
      );

      // text
      ctx.fillStyle = this.config.colors.primary;
      ctx.fillText(
        description,
        drawPosition(entity.pos.x - ig.game.screen.x), // TODO
        drawPosition(entity.pos.y - ig.game.screen.y)
      );
    }

    // line to targets
    if (typeof entity.target !== "object") return;
    for (let t in entity.target) this.drawLineToTarget(entity, entity.target[t]);
  }

  drawLineToTarget(ent, target) {
    target = ig.game.getEntityByName(target); // TODO
    if (!target) return;

    const { ctx, drawPosition } = this.system;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(
      drawPosition(ent.pos.x + ent.size.x / 2 - ig.game.screen.x), // TODO
      drawPosition(ent.pos.y + ent.size.y / 2 - ig.game.screen.y)
    );
    ctx.lineTo(
      drawPosition(target.pos.x + target.size.x / 2 - ig.game.screen.x), // TODO
      drawPosition(target.pos.y + target.size.y / 2 - ig.game.screen.y)
    );
    ctx.stroke();
    ctx.closePath();
  }

  drawCursor(_x, _y) {
    if (!this.selectedEntity) return;
    const { ctx, drawPosition, scale } = this.system;
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.config.colors.highlight;
    ctx.strokeRect(
      drawPosition(this.selectedEntity.pos.x - ig.editor.screen.x) - 0.5, // TODO
      drawPosition(this.selectedEntity.pos.y - ig.editor.screen.y) - 0.5,
      this.selectedEntity.size.x * scale + 1,
      this.selectedEntity.size.y * scale + 1
    );
  }

  //#endregion Drawing
}
