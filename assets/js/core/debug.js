class GameDebugger {
  /** @type {Game} */
  game = null;
  /** @type {System} */
  system = null;
  baseEntityClass = null;
  /** @type {GameLoop} */
  gameLoop = null;
  /** @type {Entity} */
  selectedEntity = null;
  stats = null;
  DOMElements = {};

  constructor({ game, gameLoop, system, baseEntityClass }) {
    Guard.againstNull({ baseEntityClass });
    Guard.againstNull({ game });
    Guard.againstNull({ gameLoop });
    Guard.againstNull({ system });
    this.baseEntityClass = baseEntityClass;
    this.game = game;
    this.gameLoop = gameLoop;
    this.system = system;

    this.#createContainers();
    this.#attachDebugMethods();
    this.#updateActiveEntityList();
  }

  #createContainers() {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = "assets/css/debug.css";
    document.body.appendChild(style);

    const debugPanel = document.createElement("div");
    debugPanel.id = "debug-panel";
    this.DOMElements.panel = debugPanel;
    document.body.prepend(debugPanel);

    const selectedEntity = document.createElement("div");
    selectedEntity.id = "debug-entity";
    const heading = document.createElement("div");
    heading.id = "debug-heading";
    heading.innerHTML = "Selected Entity";
    selectedEntity.append(heading);
    selectedEntity.innerHTML += "No Entity Selected.";
    this.DOMElements.selectedEntity = selectedEntity;
    debugPanel.append(selectedEntity);

    const activeEntityList = document.createElement("div");
    activeEntityList.id = "debug-active-entities";
    activeEntityList.innerHTML = `<div>No active entities.</div>`;
    this.DOMElements.activeEntityList = activeEntityList;
    debugPanel.append(activeEntityList);

    // position stats in bottom right corner.
    const width = 96;
    const height = 48;
    const { offsetLeft, offsetTop, offsetHeight, offsetWidth } = this.system.canvas;
    const statsPositionX = offsetLeft + offsetWidth - width;
    const statsPositionY = offsetTop - 55 + offsetHeight - height;
    this.stats = new Stats({
      containerElementStyles: {
        position: "absolute",
        left: statsPositionX + "px",
        top: statsPositionY + "px",
      },
      height,
      target: document.body,
      width,
    });
  }

  #injectEntityOverrides() {
    const gameDebugger = this;

    const entityProto = this.baseEntityClass.prototype;
    entityProto._debugColors = {
      names: "#fff",
      velocities: "#0f0",
      boxes: "#f00",
    };
    entityProto._debugCollisionEnabled = true;
    entityProto._debugShowHitbox = true;
    entityProto._debugShowVelocity = true;
    entityProto._debugShowName = true;

    // Entity Debug methods
    entityProto._debugDrawLine = function (color, sx, sy, dx, dy) {
      const { ctx, drawPosition } = this.game.system;
      const { x, y } = this.game.screen.actual;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(drawPosition(sx - x), drawPosition(sy - y));
      ctx.lineTo(drawPosition(dx - x), drawPosition(dy - y));
      ctx.stroke();
      ctx.closePath();
    };

    entityProto.baseDraw = entityProto.draw;
    entityProto.draw = function () {
      this.baseDraw();
      const { ctx, drawPosition, scale } = this.game.system;
      // Collision Boxes
      if (this._debugShowHitbox) {
        const { x, y } = this.game.screen.actual;
        ctx.strokeStyle = this._debugColors.boxes;
        ctx.lineWidth = 1.0;
        ctx.strokeRect(
          drawPosition(this.pos.x.round() - x) - 0.5,
          drawPosition(this.pos.y.round() - y) - 0.5,
          this.size.x * scale,
          this.size.y * scale
        );
      }

      // Velocities
      if (this._debugShowVelocity) {
        const x = this.pos.x + this.size.x / 2;
        const y = this.pos.y + this.size.y / 2;
        this._debugDrawLine(this._debugColors.velocities, x, y, x + this.vel.x, y + this.vel.y);
      }

      // Names & Targets
      if (this._debugShowName) {
        if (this.name) {
          const { x, y } = this.game.screen.actual;
          ctx.fillStyle = this._debugColors.names;
          this.game.font.write(
            this.name,
            drawPosition(this.pos.x - x),
            drawPosition(this.pos.y - y) - 10,
            {
              color: "green",
              size: 20,
            }
          );
        }

        if (typeof this.target === "object") {
          for (let t in this.target) {
            const ent = this.game.getEntityByName(this.target[t]);
            if (!ent) continue;
            this._debugDrawLine(
              this._debugColors.names,
              this.pos.x + this.size.x / 2,
              this.pos.y + this.size.y / 2,
              ent.pos.x + ent.size.x / 2,
              ent.pos.y + ent.size.y / 2
            );
          }
        }
      }
    };

    entityProto.baseUpdate = entityProto.update;
    entityProto.update = function () {
      this.baseUpdate();
      gameDebugger.#updateSelectedEntity();
    };

    entityProto.baseCheckWith = entityProto.checkWith;
    entityProto.checkWith = function (other) {
      if (!this._debugCollisionEnabled || !other._debugCollisionEnabled) return;
      this.baseCheckWith(other);
    };

    const canvas = this.system.canvas;
    canvas.addEventListener("click", ({ clientX, clientY }) => {
      const x = clientX - canvas.offsetLeft;
      const y = clientY - canvas.offsetTop;
      for (let i = 0; i < this.game.entities.length; i++) {
        const entity = this.game.entities[i];
        if (this.#isMouseWithinEntity(x, y, entity)) {
          this.#setSelectedEntity(entity);
          break;
        }
      }
    });
  }

  #injectSystemOverrides() {}
  #injectGameOverrides() {
    const game = this.game;
    const gameDebugger = this;
    game.baseSpawnEntity = game.spawnEntity;
    game.spawnEntity = function (type, x, y, settings) {
      this.baseSpawnEntity(type, x, y, settings);
      gameDebugger.#updateActiveEntityList();
    };

    game.baseRemoveEntity = game.removeEntity;
    game.removeEntity = function (entity) {
      this.baseRemoveEntity(entity);
      gameDebugger.#updateActiveEntityList();
    };
  }

  #injectLoopOverrides() {
    const loop = this.gameLoop;
    const gameDebugger = this;
    loop.baseMain = loop.main;
    loop.main = function (timestamp) {
      this.baseMain(timestamp);
      gameDebugger.stats.update();
    };
  }

  #attachDebugMethods() {
    this.#injectEntityOverrides();
    this.#injectSystemOverrides();
    this.#injectGameOverrides();
    this.#injectLoopOverrides();
  }

  #updateActiveEntityList() {
    const entities = this.game.entities;
    const container = $el("#debug-active-entities");
    container.innerHTML = "";

    const heading = document.createElement("div");
    heading.id = "debug-heading";
    heading.innerHTML = "Active Entities";
    container.append(heading);
    if (entities.length === 0) {
      container.innerHTML += "No Active Entities";
      return;
    }

    const entityList = document.createElement("ul");
    entityList.id = "debug-active-entities-list";

    for (let i = 0; i < this.game.entities.length; i++) {
      const e = this.game.entities[i];
      const item = document.createElement("li");
      item.classList.add("debug-active-entities-item");
      item.innerHTML = `(#${e.id}) ${e.constructor.name}`;
      item.addEventListener("click", () => this.#setSelectedEntity(e));
      entityList.append(item);
    }
    container.append(entityList);
  }

  #setSelectedEntity(entity) {
    console.debug("GameDebugger: Selected:", entity);

    this.selectedEntity = entity;
    const container = this.DOMElements.selectedEntity;
    container.innerHTML = "";

    const heading = document.createElement("div");
    heading.id = "debug-heading";
    heading.innerHTML = "Selected Entity";
    container.append(heading);

    if (!this.selectedEntity) {
      container.innerHTML += "No Entity Selected.";
      return;
    }

    const nameOption = entity.name
      ? `
    <tr class="toggle">
      <td>Show name</td>
      <td id="debug-entity-show-name">${entity._debugShowName}</td>
    <tr>
    `
      : "";

    const r = Math.round;
    container.innerHTML += `
    <table id="debug-entity-info">
      <thead>
        <tr>
          <th>${entity.constructor.name}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Id</td>
          <td id="debug-entity-id">${entity.id}</td>
        </tr>
        <tr>
          <td>Size</td>
          <td id="debug-entity-size" class="dual-row">
            <span>w: ${r(entity.size.x)}</span>
            <span>h: ${r(entity.size.y)}</span>
          </td>
        </tr>
        <tr>
          <td>Position</td>
          <td id="debug-entity-position" class="dual-row">
            <span>x: ${r(entity.pos.x)}</span>
            <span>y: ${r(entity.pos.y)}</span>
          </td>
        </tr>
        <tr>
          <td>Speed</td>
          <td id="debug-entity-speed" class="dual-row">
            <span>x: ${r(entity.vel.x)}</span>
            <span>y: ${r(entity.vel.y)}</span>
          </td>
        </tr>
        <tr>
          <td style="text-align:center;">Options</td>
        </tr>
        <tr class="toggle">
          <td>Collision Enabled</td>
          <td id="debug-entity-collision-on">${entity._debugCollisionEnabled}</td>
        </tr>
        <tr class="toggle">
          <td>Show Velocity</td>
          <td id="debug-entity-show-path">${entity._debugShowVelocity}</td>
        </tr>
        <tr class="toggle">
          <td>Show Hitbox</td>
          <td id="debug-entity-show-hitbox">${entity._debugShowHitbox}</td>
        </tr>
        ${nameOption}
      </tbody>
    </table>
    `;

    $el("#debug-entity-collision-on").parentElement.addEventListener("click", () => {
      entity._debugCollisionEnabled = !entity._debugCollisionEnabled;
    });
    $el("#debug-entity-show-path").parentElement.addEventListener("click", () => {
      entity._debugShowVelocity = !entity._debugShowVelocity;
    });
    $el("#debug-entity-show-hitbox").parentElement.addEventListener("click", () => {
      entity._debugShowHitbox = !entity._debugShowHitbox;
    });
    if (!entity.name) return;
    $el("#debug-entity-show-name").parentElement.addEventListener("click", () => {
      entity._debugShowName = !entity._debugShowName;
    });
  }

  #updateSelectedEntity() {
    if (!this.selectedEntity) return;

    const r = Math.round;
    const entity = this.selectedEntity;
    $el("#debug-entity-position").innerHTML = `<span>x: ${r(entity.pos.x)}</span>
      <span>y: ${r(entity.pos.y)}</span>`;
    $el("#debug-entity-speed").innerHTML = `<span>x: ${r(entity.vel.x)}</span>
      <span>y: ${r(entity.vel.y)}</span>`;

    $el("#debug-entity-collision-on").innerHTML = `${entity._debugCollisionEnabled}`;
    $el("#debug-entity-show-path").innerHTML = `${entity._debugShowVelocity}`;
    $el("#debug-entity-show-hitbox").innerHTML = `${entity._debugShowHitbox}`;
    if (!entity.name) return;
    $el("#debug-entity-show-name").innerHTML = `${entity._debugShowName}`;
  }

  #isMouseWithinEntity(x, y, entity) {
    const mouseWidth = 0.1;
    if (
      !(
        x > entity.pos.x + entity.size.x ||
        x + mouseWidth < entity.pos.x ||
        y > entity.pos.y + entity.size.y ||
        y + mouseWidth < entity.pos.y
      )
    ) {
      return true;
    }
    return false;
  }
}
