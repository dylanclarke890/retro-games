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
  }

  #createContainers() {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = "assets/css/debug.css";
    document.body.appendChild(style);

    const selectedEntity = document.createElement("div");
    selectedEntity.id = "debug-entity";
    selectedEntity.innerHTML = "No Entity Selected.";
    this.DOMElements.selectedEntity = selectedEntity;
    document.body.prepend(selectedEntity);

    const toggleAllOptions = document.createElement("div");
    toggleAllOptions.id = "debug-entity-toggle-all";
    // TODO
    toggleAllOptions.innerHTML = `
      <div>Collision<div>
    `;
    document.body.prepend(toggleAllOptions);
  }

  #attachDebugMethods() {
    const gameDebugger = this;

    const entityProto = this.baseEntityClass.prototype;
    entityProto._debugColors = {
      names: "#fff",
      velocities: "#0f0",
      boxes: "#f00",
    };
    entityProto._debugEnableChecks = true;
    entityProto._debugShowBoxes = true;
    entityProto._debugShowVelocities = true;
    entityProto._debugShowNames = true;

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
      if (this._debugShowBoxes) {
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
      if (this._debugShowVelocities) {
        const x = this.pos.x + this.size.x / 2;
        const y = this.pos.y + this.size.y / 2;
        this._debugDrawLine(this._debugColors.velocities, x, y, x + this.vel.x, y + this.vel.y);
      }

      // Names & Targets
      if (this._debugShowNames) {
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
      gameDebugger.updateSelectedEntity();
    };

    entityProto.baseCheckWith = entityProto.checkWith;
    entityProto.checkWith = function (other) {
      if (!this._debugEnableChecks || !other._debugEnableChecks) return;
      this.baseCheckWith(other);
    };

    const canvas = this.system.canvas;
    canvas.addEventListener("click", ({ clientX, clientY }) => {
      const x = clientX - canvas.offsetLeft;
      const y = clientY - canvas.offsetTop;
      for (let i = 0; i < this.game.entities.length; i++) {
        const entity = this.game.entities[i];
        if (this.#isMouseWithinEntity(x, y, entity)) {
          this.setSelectedEntity(entity);
          break;
        }
      }
    });
  }

  setSelectedEntity(entity) {
    console.debug("GameDebugger: Selected:", entity);
    this.selectedEntity = entity;
    const container = this.DOMElements.selectedEntity;
    if (!this.selectedEntity) {
      container.innerHTML = "No Entity Selected.";
      return;
    }

    const nameOption = entity.name
      ? `
    <tr>
      <td>Show name</td>
      <td id="debug-entity-show-name">${entity._debugShowNames}</td>
    <tr>
    `
      : "";

    const r = Math.round;
    container.innerHTML = `
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
        <tr>
          <td>Collision Enabled</td>
          <td id="debug-entity-collision-on">${entity._debugEnableChecks}</td>
        </tr>
        <tr>
          <td>Show Velocity</td>
          <td id="debug-entity-show-path">${entity._debugShowVelocities}</td>
        </tr>
        <tr>
          <td>Show Hitbox</td>
          <td id="debug-entity-show-hitbox">${entity._debugShowBoxes}</td>
        </tr>
        ${nameOption}
      </tbody>
    </table>
    `;

    document.getElementById("debug-entity-collision-on").addEventListener("click", () => {
      entity._debugEnableChecks = !entity._debugEnableChecks;
    });
    document.getElementById("debug-entity-show-path").addEventListener("click", () => {
      entity._debugShowVelocities = !entity._debugShowVelocities;
    });
    document.getElementById("debug-entity-show-hitbox").addEventListener("click", () => {
      entity._debugShowBoxes = !entity._debugShowBoxes;
    });
    if (!entity.name) return;
    document.getElementById("debug-entity-show-name").addEventListener("click", () => {
      entity._debugShowNames = !entity._debugShowNames;
    });
  }

  updateSelectedEntity() {
    if (!this.selectedEntity) return;

    const r = Math.round;
    const entity = this.selectedEntity;
    document.getElementById("debug-entity-position").innerHTML = `
      <span>x: ${r(entity.pos.x)}</span>
      <span>y: ${r(entity.pos.y)}</span>`;

    document.getElementById("debug-entity-speed").innerHTML = `
      <span>x: ${r(entity.vel.x)}</span>
      <span>y: ${r(entity.vel.y)}</span>`;

    document.getElementById("debug-entity-collision-on").innerHTML = `
    ${entity._debugEnableChecks}`;

    document.getElementById("debug-entity-show-path").innerHTML = `
    ${entity._debugShowVelocities}`;

    document.getElementById("debug-entity-show-hitbox").innerHTML = `
    ${entity._debugShowBoxes}`;

    if (!entity.name) return;
    document.getElementById("debug-entity-show-name").innerHTML = `
    ${entity._debugShowNames}`;
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
