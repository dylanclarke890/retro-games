import { Guard } from "../lib/guard.js";
import { plugin } from "../lib/inject.js";
import { boolToOnOff } from "../lib/number-utils.js";
import { $new, $el } from "../lib/dom-utils.js";
import { dragElement } from "../lib/ui-effects.js";
import { PerformanceStats } from "./performance-stats.js";

export class GameDebugger {
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

  bulk = {
    showNames: true,
    showVelocities: true,
    showHitboxes: true,
    entityCollision: true,
  };

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
    this.#addContainerEvents();
    this.#attachDebugMethods();
    this.#updateActiveEntityList();
  }

  //#region Containers
  #addStylesheet() {
    if ($el("#debug-styles")) return;
    const style = $new("link");
    style.id = "debug-styles";
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = "assets/css/debug.css";
    document.body.appendChild(style);
  }

  #newHeading(textContent) {
    const heading = $new("div");
    heading.classList.add("debug-heading");
    heading.textContent = textContent;
    return heading;
  }

  #newSelectedEntityContainer() {
    const selectedEntity = $new("div");
    selectedEntity.id = "debug-entity";
    selectedEntity.classList.add("debug-subpanel");
    selectedEntity.append(this.#newHeading("Selected Entity"));
    selectedEntity.innerHTML += "<div id='no-entity'>No Entity Selected.</div>";
    this.DOMElements.selectedEntity = selectedEntity;
    return selectedEntity;
  }

  #newActiveEntitiesContainer() {
    const activeEntityList = $new("div");
    activeEntityList.classList.add("debug-subpanel");
    activeEntityList.id = "debug-active-entities";
    activeEntityList.append(this.#newHeading("Active Entities"));
    activeEntityList.innerHTML = "<div>No active entities.</div>";
    this.DOMElements.activeEntityList = activeEntityList;
    return activeEntityList;
  }

  #newBulkActionsContainer() {
    const bulkActions = $new("div");
    bulkActions.id = "debug-bulk-actions";
    bulkActions.classList.add("debug-subpanel");
    bulkActions.append(this.#newHeading("Bulk Actions"));

    const { entityCollision, showNames, showVelocities, showHitboxes } = this.bulk;
    const row = (name, val, idSuffix) => `
      <tr class="toggle">
        <td>${name}</td>
        <td id="debug-bulk-${idSuffix}">${boolToOnOff(val)}</td>
      </tr>
    `;
    bulkActions.innerHTML += `
    <table>
      <tbody>
        ${row("Show Names", showNames, "show-name")}
        ${row("Show Hitboxes", showHitboxes, "show-hitbox")}
        ${row("Show Velocities", showVelocities, "show-path")}
        ${row("Entity Collision", entityCollision, "collision-on")}
      </tbody>
    </table>
    `;

    this.DOMElements.bulkActions = bulkActions;
    return bulkActions;
  }

  #newStatsContainer() {
    const statsContainer = $new("div");
    statsContainer.id = "debug-performance";
    statsContainer.classList.add("debug-subpanel");
    statsContainer.append(this.#newHeading("Performance"));
    this.stats = new PerformanceStats({ target: statsContainer, height: 72, width: 144 });
    this.DOMElements.statsContainer = statsContainer;
    return statsContainer;
  }

  #createContainers() {
    this.#addStylesheet();

    const debugPanel = $new("div");
    debugPanel.id = "debug-panel";
    this.DOMElements.panel = debugPanel;
    debugPanel.append(this.#newStatsContainer());
    debugPanel.append(this.#newBulkActionsContainer());
    debugPanel.append(this.#newSelectedEntityContainer());
    debugPanel.append(this.#newActiveEntitiesContainer());
    document.body.prepend(debugPanel);
  }

  #addContainerEvents() {
    const { selectedEntity, statsContainer, bulkActions, activeEntityList } = this.DOMElements;
    selectedEntity.draggable = true;
    statsContainer.draggable = true;
    bulkActions.draggable = true;
    activeEntityList.draggable = true;
    dragElement(selectedEntity);
    dragElement(statsContainer);
    dragElement(bulkActions);
    dragElement(activeEntityList);
    statsContainer.style.left = "10px";
    statsContainer.style.top = "10px";
    bulkActions.style.left = "200px";
    bulkActions.style.top = "10px";
    selectedEntity.style.left = "10px";
    selectedEntity.style.top = "170px";
    activeEntityList.style.left = "10px";
    activeEntityList.style.top = "420px";

    const forEachEntity = (cb) => {
      for (let i = 0; i < this.game.entities.length; i++) cb(this.game.entities[i]);
    };

    $el("#debug-bulk-collision-on").parentElement.addEventListener("click", () => {
      this.bulk.entityCollision = !this.bulk.entityCollision;
      forEachEntity((e) => (e._debugCollisionWithEntity = this.bulk.entityCollision));
      this.#updateBulkActionsDisplay();
    });

    $el("#debug-bulk-show-path").parentElement.addEventListener("click", () => {
      this.bulk.showVelocities = !this.bulk.showVelocities;
      forEachEntity((e) => (e._debugShowVelocity = this.bulk.showVelocities));
      this.#updateBulkActionsDisplay();
    });

    $el("#debug-bulk-show-hitbox").parentElement.addEventListener("click", () => {
      this.bulk.showHitboxes = !this.bulk.showHitboxes;
      forEachEntity((e) => (e._debugShowHitbox = this.bulk.showHitboxes));
      this.#updateBulkActionsDisplay();
    });

    $el("#debug-bulk-show-name").parentElement.addEventListener("click", () => {
      this.bulk.showNames = !this.bulk.showNames;
      forEachEntity((e) => (e._debugShowName = this.bulk.showNames));
      this.#updateBulkActionsDisplay();
    });
  }

  //#endregion Containers

  #injectEntityOverrides() {
    const gameDebugger = this;

    const entityOverrides = [
      {
        name: "_debugColors",
        value: {
          names: "#fff",
          velocities: "#0f0",
          boxes: "#f00",
        },
      },
      { name: "_debugShowHitbox", value: true },
      { name: "_debugShowVelocity", value: true },
      { name: "_debugShowName", value: true },
      { name: "_debugCollisionWithEntity", value: true },
      {
        name: "_debugDrawLine",
        value: function (color, sx, sy, dx, dy) {
          const { ctx, drawPosition } = this.game.system;
          const { x, y } = this.game.screen.actual;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(drawPosition(sx - x), drawPosition(sy - y));
          ctx.lineTo(drawPosition(dx - x), drawPosition(dy - y));
          ctx.stroke();
          ctx.closePath();
        },
      },
      {
        name: "update",
        value: function () {
          this.base();
          gameDebugger.#updateSelectedEntity();
        },
      },
      {
        name: "checkWith",
        value: function (other) {
          if (!this._debugCollisionWithEntity || !other._debugCollisionWithEntity) return;
          this.base(other);
        },
      },
      {
        name: "draw",
        value: function () {
          this.base();
          const { ctx, drawPosition, scale } = this.game.system;
          // Collision Boxes
          if (this._debugShowHitbox) {
            const { x, y } = this.game.screen.actual;
            ctx.strokeStyle = this._debugColors.boxes;
            ctx.lineWidth = 1.0;
            ctx.strokeRect(
              drawPosition(Math.round(this.pos.x) - x) - 0.5,
              drawPosition(Math.round(this.pos.y) - y) - 0.5,
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
              this.game.fonts.standard.write(
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
        },
      },
    ];

    plugin(entityOverrides).to(this.baseEntityClass);

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

  #injectGameOverrides() {
    const gameDebugger = this;
    const gameOverrides = [
      {
        name: "spawnEntity",
        value: function (type, x, y, settings) {
          this.base(type, x, y, settings);
          gameDebugger.#updateActiveEntityList();
        },
      },
      {
        name: "removeEntity",
        value: function (entity) {
          this.base(entity);
          gameDebugger.#updateActiveEntityList();
        },
      },
    ];

    plugin(gameOverrides).to(this.game);
  }

  #injectLoopOverrides() {
    const gameDebugger = this;

    const loopOverrides = [
      {
        name: "main",
        value: function (timestamp) {
          this.base(timestamp);
          gameDebugger.stats.update();
        },
      },
    ];

    plugin(loopOverrides).to(this.gameLoop);
  }

  #attachDebugMethods() {
    this.#injectEntityOverrides();
    this.#injectGameOverrides();
    this.#injectLoopOverrides();
  }

  #updateActiveEntityList() {
    console.debug("GameDebugger: Updating Active Entities...");

    const entities = this.game.entities;
    const container = $el("#debug-active-entities");

    container.innerHTML = "";
    container.append(this.#newHeading("Active Entities"));
    if (entities.length === 0) {
      container.innerHTML += "<div>No Active Entities</div>";
      return;
    }

    const entityList = $new("ul");
    entityList.id = "debug-active-entities-list";
    for (let i = 0; i < this.game.entities.length; i++) {
      const e = this.game.entities[i];
      const item = $new("li");
      item.classList.add("debug-active-entities-item");
      item.textContent = `(#${e.id}) ${e.constructor.name}`;
      item.addEventListener("click", () => this.#setSelectedEntity(e));
      entityList.append(item);
    }
    container.append(entityList);
  }

  #setSelectedEntity(entity) {
    console.debug("GameDebugger: Entity Selected...");

    this.selectedEntity = entity;
    const container = this.DOMElements.selectedEntity;
    container.innerHTML = "";
    container.append(this.#newHeading("Selected Entity"));

    if (!this.selectedEntity) {
      container.innerHTML += "<div id='no-entity'>No Entity Selected.</div>";
      return;
    }

    const r = Math.round;
    const entityTable = $new("table");
    entityTable.id = "debug-entity-info";
    entityTable.innerHTML = `
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
          <td class="dual-row">
            <span id="debug-entity-position-x">x: ${r(entity.pos.x)}</span>
            <span id="debug-entity-position-y">y: ${r(entity.pos.y)}</span>
          </td>
        </tr>
        <tr>
          <td>Speed</td>
          <td class="dual-row">
            <span id="debug-entity-speed-x">x: ${r(entity.vel.x)}</span>
            <span id="debug-entity-speed-y">y: ${r(entity.vel.y)}</span>
          </td>
        </tr>
      </tbody>
    `;
    container.append(entityTable);

    const entityOption = (name, val, idSuffix) => `
    <div class="toggle">
      <span>${name}</span>
      <span id="debug-entity-${idSuffix}">${boolToOnOff(val)}</span>
    </div>
    `;
    const { _debugShowVelocity, _debugShowHitbox, _debugShowName, _debugCollisionWithEntity } =
      entity;
    const nameOption = entity.name ? entityOption("Show Name", _debugShowName, "show-name") : "";

    const debugOptions = $new("div");
    debugOptions.id = "debug-entity-options";
    debugOptions.innerHTML = `
      ${nameOption}
      ${entityOption("Show Hitbox", _debugShowHitbox, "show-hitbox")}
      ${entityOption("Show Velocity", _debugShowVelocity, "show-path")}
      ${entityOption("Entity Collision", _debugCollisionWithEntity, "collision-on")}
    `;

    container.append(debugOptions);

    $el("#debug-entity-collision-on").parentElement.addEventListener("click", () => {
      entity._debugCollisionWithEntity = !entity._debugCollisionWithEntity;
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
    $el("#debug-entity-position-x").textContent = `x: ${r(entity.pos.x)}`;
    $el("#debug-entity-position-y").textContent = `y: ${r(entity.pos.y)}`;
    $el("#debug-entity-speed-x").textContent = `x: ${r(entity.vel.x)}`;
    $el("#debug-entity-speed-y").textContent = `y: ${r(entity.vel.y)}`;

    $el("#debug-entity-collision-on").textContent = `${boolToOnOff(
      entity._debugCollisionWithEntity
    )}`;
    $el("#debug-entity-show-path").textContent = `${boolToOnOff(entity._debugShowVelocity)}`;
    $el("#debug-entity-show-hitbox").textContent = `${boolToOnOff(entity._debugShowHitbox)}`;
    if (!entity.name) return;
    $el("#debug-entity-show-name").textContent = `${boolToOnOff(entity._debugShowName)}`;
  }

  #updateBulkActionsDisplay() {
    $el("#debug-bulk-show-path").textContent = boolToOnOff(this.bulk.showVelocities);
    $el("#debug-bulk-show-hitbox").textContent = boolToOnOff(this.bulk.showHitboxes);
    $el("#debug-bulk-show-name").textContent = boolToOnOff(this.bulk.showNames);
    $el("#debug-bulk-collision-on").textContent = boolToOnOff(this.bulk.entityCollision);
    $el("#debug-bulk-map-collision-x").textContent = boolToOnOff(this.bulk.mapCollisionX);
    $el("#debug-bulk-map-collision-y").textContent = boolToOnOff(this.bulk.mapCollisionY);
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
