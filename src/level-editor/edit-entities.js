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
    const entityKey = $new("div");
    entityKey.id = "entityKey";
    entityKey.addEventListener("keydown", (e) => {
      if (e.which == 13) {
        // TODO
        $el("#entityValue").focus();
        return false;
      }
      return true;
    });
    const entityValue = $new("div");
    entityValue.id = "entityValue";
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
    const x = x - entity.pos.x + entity.offset.x;
    const y = y - entity.pos.y + entity.offset.y;
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
    if (!this.selectedEntity) {
      return false;
    }

    ig.game.undo.commitEntityDelete(this.selectedEntity);

    this.removeEntity(this.selectedEntity);
    this.selectEntity(null);
    return true;
  }

  removeEntity(ent) {
    if (ent.name) {
      delete this.namedEntities[ent.name];
    }
    this.entities.erase(ent);
  }

  cloneSelectedEntity() {
    if (!this.selectedEntity) {
      return false;
    }

    var className = this.selectedEntity._wmClassName;
    var settings = ig.copy(this.selectedEntity._wmSettings);
    if (settings.name) {
      settings.name = settings.name + "_clone";
    }
    var x = this.selectedEntity.pos.x + this.gridSize;
    var y = this.selectedEntity.pos.y;
    var newEntity = this.spawnEntity(className, x, y, settings);
    newEntity._wmSettings = settings;
    this.selectEntity(newEntity);

    ig.game.undo.commitEntityCreate(newEntity);

    return true;
  }

  dragOnSelectedEntity(x, y) {
    if (!this.selectedEntity) {
      return false;
    }

    // scale or move?
    if (this.selectedEntity._wmScalable && this.wasSelectedOnScaleBorder) {
      this.scaleSelectedEntity(x, y);
    } else {
      this.moveSelectedEntity(x, y);
    }

    ig.game.undo.pushEntityEdit(this.selectedEntity);
    return true;
  }

  moveSelectedEntity(x, y) {
    x =
      Math.round((x - this.selector.offset.x) / this.gridSize) * this.gridSize +
      this.selectedEntity.offset.x;
    y =
      Math.round((y - this.selector.offset.y) / this.gridSize) * this.gridSize +
      this.selectedEntity.offset.y;

    // new position?
    if (this.selectedEntity.pos.x != x || this.selectedEntity.pos.y != y) {
      $("#entityDefinitionPosX").text(x);
      $("#entityDefinitionPosY").text(y);

      this.selectedEntity.pos.x = x;
      this.selectedEntity.pos.y = y;
    }
  }

  scaleSelectedEntity(x, y) {
    var scale = this.wasSelectedOnScaleBorder;

    var w = Math.round(x / this.gridSize) * this.gridSize - this.selectedEntity.pos.x;

    if (!this.selectedEntity._wmSettings.size) {
      this.selectedEntity._wmSettings.size = {};
    }

    if (scale == "n") {
      var h = this.selectedEntity.pos.y - Math.round(y / this.gridSize) * this.gridSize;
      if (this.selectedEntity.size.y + h <= this.gridSize) {
        h = (this.selectedEntity.size.y - this.gridSize) * -1;
      }
      this.selectedEntity.size.y += h;
      this.selectedEntity.pos.y -= h;
    } else if (scale == "s") {
      var h = Math.round(y / this.gridSize) * this.gridSize - this.selectedEntity.pos.y;
      this.selectedEntity.size.y = Math.max(this.gridSize, h);
    } else if (scale == "e") {
      var w = Math.round(x / this.gridSize) * this.gridSize - this.selectedEntity.pos.x;
      this.selectedEntity.size.x = Math.max(this.gridSize, w);
    } else if (scale == "w") {
      var w = this.selectedEntity.pos.x - Math.round(x / this.gridSize) * this.gridSize;
      if (this.selectedEntity.size.x + w <= this.gridSize) {
        w = (this.selectedEntity.size.x - this.gridSize) * -1;
      }
      this.selectedEntity.size.x += w;
      this.selectedEntity.pos.x -= w;
    }
    this.selectedEntity._wmSettings.size.x = this.selectedEntity.size.x;
    this.selectedEntity._wmSettings.size.y = this.selectedEntity.size.y;

    this.loadEntitySettings();
  }

  newEntityClick(ev) {
    this.hideMenu();
    var newEntity = this.spawnEntity(ev.target.id, 0, 0, {});
    this.selectEntity(newEntity);
    this.moveSelectedEntity(this.selector.pos.x, this.selector.pos.y);
    ig.editor.setModified();

    ig.game.undo.commitEntityCreate(newEntity);
  }

  spawnEntity(className, x, y, settings) {
    settings = settings || {};
    var entityClass = ig.global[className];
    if (entityClass) {
      var newEntity = new entityClass(x, y, settings);
      newEntity._wmInEditor = true;
      newEntity._wmClassName = className;
      newEntity._wmSettings = {};
      for (var s in settings) {
        newEntity._wmSettings[s] = settings[s];
      }
      this.entities.push(newEntity);
      if (settings.name) {
        this.namedEntities[settings.name] = newEntity;
      }
      this.sort();
      return newEntity;
    }
    return null;
  }

  isOnScaleBorder(entity, selector) {
    var border = 2;
    var w = selector.pos.x - entity.pos.x;
    var h = selector.pos.y - entity.pos.y;

    if (w < border) return "w";
    if (w > entity.size.x - border) return "e";

    if (h < border) return "n";
    if (h > entity.size.y - border) return "s";

    return false;
  }

  //#endregion Creating, Deleting, Moving

  //#region Settings

  loadEntitySettings() {
    if (!this.selectedEntity) {
      return;
    }
    var html =
      '<div class="entityDefinition"><span class="key">x</span>:<span class="value" id="entityDefinitionPosX">' +
      this.selectedEntity.pos.x +
      "</span></div>" +
      '<div class="entityDefinition"><span class="key">y</span>:<span class="value" id="entityDefinitionPosY">' +
      this.selectedEntity.pos.y +
      "</span></div>";

    html += this.loadEntitySettingsRecursive(this.selectedEntity._wmSettings);
    this.entityDefinitions.html(html);

    var className = this.selectedEntity._wmClassName.replace(/^Entity/, "");
    $("#entityClass").text(className);

    $(".entityDefinition").bind("mouseup", this.selectEntitySetting);
  }

  loadEntitySettingsRecursive(settings, path) {
    path = path || "";
    var html = "";
    for (var key in settings) {
      var value = settings[key];
      if (typeof value == "object") {
        html += this.loadEntitySettingsRecursive(value, path + key + ".");
      } else {
        html +=
          '<div class="entityDefinition"><span class="key">' +
          path +
          key +
          '</span>:<span class="value">' +
          value +
          "</span></div>";
      }
    }

    return html;
  }

  setEntitySetting(ev) {
    if (ev.which != 13) {
      return true;
    }
    var key = $("#entityKey").val();
    var value = $("#entityValue").val();
    var floatVal = parseFloat(value);
    if (value == floatVal) {
      value = floatVal;
    }

    if (key == "name") {
      if (this.selectedEntity.name) {
        delete this.namedEntities[this.selectedEntity.name];
      }
      this.namedEntities[value] = this.selectedEntity;
    }

    if (key == "x") {
      this.selectedEntity.pos.x = Math.round(value);
    } else if (key == "y") {
      this.selectedEntity.pos.y = Math.round(value);
    } else {
      this.writeSettingAtPath(this.selectedEntity._wmSettings, key, value);
      ig.merge(this.selectedEntity, this.selectedEntity._wmSettings);
    }

    this.sort();

    ig.game.setModified();
    ig.game.draw();

    $("#entityKey").val("");
    $("#entityValue").val("");
    $("#entityValue").blur();
    this.loadEntitySettings();

    $("#entityKey").focus();
    return false;
  }

  writeSettingAtPath(root, path, value) {
    path = path.split(".");
    var cur = root;
    for (var i = 0; i < path.length; i++) {
      var n = path[i];
      if (i < path.length - 1 && typeof cur[n] != "object") {
        cur[n] = {};
      }

      if (i == path.length - 1) {
        cur[n] = value;
      }
      cur = cur[n];
    }

    this.trimObject(root);
  }

  trimObject(obj) {
    var isEmpty = true;
    for (var i in obj) {
      if (obj[i] === "" || (typeof obj[i] == "object" && this.trimObject(obj[i]))) {
        delete obj[i];
      }

      if (typeof obj[i] != "undefined") {
        isEmpty = false;
      }
    }

    return isEmpty;
  }

  selectEntitySetting(ev) {
    $("#entityKey").val($(this).children(".key").text());
    $("#entityValue").val($(this).children(".value").text());
    $("#entityValue").select();
  }

  //#region Settings

  //#region UI

  setHotkey(hotkey) {
    this.hotkey = hotkey;
    this.div.attr("title", "Select Layer (" + this.hotkey + ")");
  }

  showMenu(x, y) {
    this.selector.pos = {
      x: Math.round((x + ig.editor.screen.x) / this.gridSize) * this.gridSize,
      y: Math.round((y + ig.editor.screen.y) / this.gridSize) * this.gridSize,
    };
    this.menu.css({ top: y * ig.system.scale + 2, left: x * ig.system.scale + 2 });
    this.menu.show();
  }

  hideMenu() {
    ig.editor.mode = ig.editor.MODE.DEFAULT;
    this.menu.hide();
  }

  setActive(active) {
    this.active = active;
    if (active) {
      this.div.addClass("layerActive");
    } else {
      this.div.removeClass("layerActive");
    }
  }

  toggleVisibility() {
    this.visible ^= 1;
    if (this.visible) {
      this.div.children(".visible").addClass("checkedVis");
    } else {
      this.div.children(".visible").removeClass("checkedVis");
    }
    ig.game.draw();
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
    ig.editor.setActiveLayer("entities");
  }

  mousemove(x, y) {
    this.selector.pos = { x: x, y: y };

    if (this.selectedEntity) {
      if (this.selectedEntity._wmScalable && this.selectedEntity.touches(this.selector)) {
        var scale = this.isOnScaleBorder(this.selectedEntity, this.selector);
        if (scale == "n" || scale == "s") {
          $("body").css("cursor", "ns-resize");
          return;
        } else if (scale == "e" || scale == "w") {
          $("body").css("cursor", "ew-resize");
          return;
        }
      }
    }

    $("body").css("cursor", "default");
  }

  //#region UI

  //#region Drawing

  draw() {
    if (this.visible) {
      for (var i = 0; i < this.entities.length; i++) {
        this.drawEntity(this.entities[i]);
      }
    }
  }

  drawEntity(ent) {
    // entity itself
    ent.draw();

    // box
    if (ent._wmDrawBox) {
      ig.system.context.fillStyle = ent._wmBoxColor || "rgba(128, 128, 128, 0.9)";
      ig.system.context.fillRect(
        ig.system.getDrawPos(ent.pos.x - ig.game.screen.x),
        ig.system.getDrawPos(ent.pos.y - ig.game.screen.y),
        ent.size.x * ig.system.scale,
        ent.size.y * ig.system.scale
      );
    }

    if (wm.config.labels.draw) {
      // description
      var className = ent._wmClassName.replace(/^Entity/, "");
      var description = className + (ent.name ? ": " + ent.name : "");

      // text-shadow
      ig.system.context.fillStyle = "rgba(0,0,0,0.4)";
      ig.system.context.fillText(
        description,
        ig.system.getDrawPos(ent.pos.x - ig.game.screen.x),
        ig.system.getDrawPos(ent.pos.y - ig.game.screen.y + 0.5)
      );

      // text
      ig.system.context.fillStyle = wm.config.colors.primary;
      ig.system.context.fillText(
        description,
        ig.system.getDrawPos(ent.pos.x - ig.game.screen.x),
        ig.system.getDrawPos(ent.pos.y - ig.game.screen.y)
      );
    }

    // line to targets
    if (typeof ent.target === "object") {
      for (var t in ent.target) {
        this.drawLineToTarget(ent, ent.target[t]);
      }
    }
  }

  drawLineToTarget(ent, target) {
    target = ig.game.getEntityByName(target);
    if (!target) {
      return;
    }

    ig.system.context.strokeStyle = "#fff";
    ig.system.context.lineWidth = 1;

    ig.system.context.beginPath();
    ig.system.context.moveTo(
      ig.system.getDrawPos(ent.pos.x + ent.size.x / 2 - ig.game.screen.x),
      ig.system.getDrawPos(ent.pos.y + ent.size.y / 2 - ig.game.screen.y)
    );
    ig.system.context.lineTo(
      ig.system.getDrawPos(target.pos.x + target.size.x / 2 - ig.game.screen.x),
      ig.system.getDrawPos(target.pos.y + target.size.y / 2 - ig.game.screen.y)
    );
    ig.system.context.stroke();
    ig.system.context.closePath();
  }

  drawCursor(x, y) {
    if (this.selectedEntity) {
      ig.system.context.lineWidth = 1;
      ig.system.context.strokeStyle = wm.config.colors.highlight;
      ig.system.context.strokeRect(
        ig.system.getDrawPos(this.selectedEntity.pos.x - ig.editor.screen.x) - 0.5,
        ig.system.getDrawPos(this.selectedEntity.pos.y - ig.editor.screen.y) - 0.5,
        this.selectedEntity.size.x * ig.system.scale + 1,
        this.selectedEntity.size.y * ig.system.scale + 1
      );
    }
  }

  //#endregion Drawing
}
