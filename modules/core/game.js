import { Guard } from "../lib/guard.js";
import { removeItem } from "../lib/array-utils.js";

import { Register } from "../core/register.js";

import { CollisionMap, BackgroundMap } from "./map.js";
import { Input } from "./input.js";
import { Entity } from "./entity.js";

export class Game {
  #autoSort = false;
  #cellSize = 64;
  /** @type {Entity[]} */
  #deferredKills = [];
  #doSortEntities = false;
  #sortBy = Game.SORT.Z_INDEX;

  levelToLoad;
  backgroundAnims = {};
  /** @type {BackgroundMap[]} */
  backgroundMaps = [];
  clearColor = "#000000";
  /** @type {CollisionMap} */
  collisionMap = CollisionMap.staticNoCollision;
  /** @type {Entity[]} */
  entities = [];
  /** @type {import("./media-factory.js").MediaFactory} */
  media;
  /** @type {Object.<string, import("./font.js").Font>} */
  fonts = {};
  gravity = 0;
  /** @type {Input} */
  input;
  /** @type {Object.<string, Entity>} */
  namedEntities = {};
  screen = {
    actual: { x: 0, y: 0 },
    rounded: { x: 0, y: 0 },
  };
  /** @type {import("./system.js").System} */
  system;

  static get SORT() {
    return {
      Z_INDEX: (/** @type {Entity} */ a, /** @type {Entity} */ b) => a.zIndex - b.zIndex,
      POS_X: (/** @type {Entity} */ a, /** @type {Entity} */ b) =>
        a.pos.x + a.size.x - (b.pos.x + b.size.x),
      POS_Y: (/** @type {Entity} */ a, /** @type {Entity} */ b) =>
        a.pos.y + a.size.y - (b.pos.y + b.size.y),
    };
  }

  constructor({ system, fonts, mediaFactory } = {}) {
    Guard.againstNull({ system });
    Guard.againstNull({ mediaFactory });
    this.system = system;
    this.media = mediaFactory;
    this.fonts = fonts;
    this.input = new Input({ system: this.system });
    this.#sortBy = this.#sortBy || Game.SORT.Z_INDEX;
  }

  update() {
    this.input.clearPressed();
    if (this.levelToLoad) {
      this.loadLevel(this.levelToLoad);
      this.levelToLoad = null;
    }

    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (!entity.killed) entity.update();
    }
    this.checkEntities();

    // remove all killed entities
    for (let i = 0; i < this.#deferredKills.length; i++) {
      const entity = this.#deferredKills[i];
      removeItem(this.entities, entity);
      entity.erase();
    }
    this.#deferredKills = [];
    if (this.#doSortEntities || this.#autoSort) this.sortEntities();

    // update background animations
    for (let tileset in this.backgroundAnims) {
      const anims = this.backgroundAnims[tileset];
      for (let a in anims) anims[a].update();
    }
  }

  draw() {
    const { drawPosition, scale } = this.system;
    if (this.clearColor) this.system.clear(this.clearColor);

    this.screen.rounded = {
      x: drawPosition(this.screen.actual.x) / scale,
      y: drawPosition(this.screen.actual.y) / scale,
    };
    let mapIndex;
    for (mapIndex = 0; mapIndex < this.backgroundMaps.length; mapIndex++) {
      const map = this.backgroundMaps[mapIndex];
      // All foreground layers are drawn after the entities
      if (map.foreground) break;
      map.setScreenPos(this.screen.actual.x, this.screen.actual.y);
      map.draw();
    }

    for (let i = 0; i < this.entities.length; i++) this.entities[i].draw();

    for (mapIndex; mapIndex < this.backgroundMaps.length; mapIndex++) {
      const map = this.backgroundMaps[mapIndex];
      map.setScreenPos(this.screen.actual.x, this.screen.actual.y);
      map.draw();
    }
  }

  loadLevel(data) {
    this.screen = {
      actual: { x: 0, y: 0 },
      rounded: { x: 0, y: 0 },
    };

    // Entities
    this.entities = [];
    this.namedEntities = {};
    for (let i = 0; i < data.entities.length; i++) {
      const { type, x, y, settings } = data.entities[i];
      this.spawnEntity(type, x, y, settings);
    }
    this.sortEntities();

    // Map Layer
    this.collisionMap = CollisionMap.staticNoCollision;
    this.backgroundMaps = [];

    data.layer = data.layer || [];
    for (let i = 0; i < data.layer.length; i++) {
      const layer = data.layer[i];
      const shared = { system: this.system, tilesize: layer.tilesize, data: layer.data };
      if (layer.name === "collision") this.collisionMap = new CollisionMap({ ...shared });
      else
        this.backgroundMaps.push(
          new BackgroundMap({
            anims: this.backgroundAnims[layer.tilesetName],
            tileset: layer.tilesetName,
            ...shared,
            ...layer,
          })
        );
    }

    // Call post-init ready function on all entities
    for (let i = 0; i < this.entities.length; i++) this.entities[i].ready();
  }

  loadLevelDeferred(data) {
    this.levelToLoad = data;
  }

  getMapByName(name) {
    if (name === "collision") return this.collisionMap;
    for (let i = 0; i < this.backgroundMaps.length; i++)
      if (this.backgroundMaps[i].name === name) return this.backgroundMaps[i];
    return null;
  }

  getEntityByName(name) {
    return this.namedEntities[name];
  }

  getEntitiesByType(type) {
    const entityClass = Register.getEntityByType(type);
    const a = [];
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (entity instanceof entityClass && !entity.killed) a.push(entity);
    }
    return a;
  }

  /**
   *
   * @template EntityType
   * @param {EntityType | string} type
   * @param {number} x
   * @param {number} y
   * @param {[Object.<string, any>]} settings
   * @returns {new (...args) => EntityType}
   */
  spawnEntity(type, x, y, settings) {
    settings ??= {};
    const entityClass = Register.getEntityByType(type);
    if (!entityClass) throw new Error(`Can't spawn entity of type ${type}`);
    const entity = new entityClass({ x, y, game: this, settings });
    this.entities.push(entity);
    if (entity.name) this.namedEntities[entity.name] = entity;
    return entity;
  }

  sortEntities() {
    this.entities.sort(this.#sortBy);
    this.#doSortEntities = false;
  }

  sortEntitiesDeferred() {
    this.#doSortEntities = true;
  }

  /**
   * Swap the positions of two entities in the list so as to draw one on top of the other.
   * @param {Entity} a
   * @param {Entity} b
   * @param {boolean} before If true, will ensure a is before b
   */
  swapEntities(a, b, before) {
    const x = this.entities.indexOf(a);
    const y = this.entities.indexOf(b);
    if (before && x < y) return; // no need to swap
    this.entities[y] = a;
    this.entities[x] = b;
  }

  removeEntity(entity) {
    if (entity.name) delete this.namedEntities[entity.name];
    // We can't remove the entity from the entities[] array in the midst
    // of an update cycle, so remember all killed entities, remove
    // them later, make sure they don't collide anymore and won't get
    // updated or checked
    entity.killed = true;
    entity.type = Entity.TYPE.NONE;
    entity.checkAgainst = Entity.TYPE.NONE;
    entity.collides = Entity.COLLIDES.NEVER;
    this.#deferredKills.push(entity);
  }

  /** Insert all entities into a spatial hash and check them against any
   * other entity that already resides in the same cell. Entities that are
   * bigger than a single cell, are inserted into each one they intersect
   * with.
   *
   * A list of entities, which the current one was already checked with,
   * is maintained for each entity.*/
  checkEntities() {
    const hash = {};
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (entity.skipCollisionChecks) continue;

      const checked = {},
        xmin = Math.floor(entity.pos.x / this.#cellSize),
        ymin = Math.floor(entity.pos.y / this.#cellSize),
        xmax = Math.floor((entity.pos.x + entity.size.x) / this.#cellSize) + 1,
        ymax = Math.floor((entity.pos.y + entity.size.y) / this.#cellSize) + 1;
      for (let x = xmin; x < xmax; x++)
        for (let y = ymin; y < ymax; y++) this.#checkCell(hash, entity, checked, x, y);
    }
  }

  #checkCell(hash, entity, checked, x, y) {
    // Current cell is empty - create it and insert!
    if (!hash[x]) hash[x] = {};
    if (!hash[x][y]) {
      hash[x][y] = [entity];
      return;
    }
    // Check against each entity in this cell, then insert
    const cell = hash[x][y];
    for (let c = 0; c < cell.length; c++) {
      // Intersects and wasn't already checked?
      if (!entity.touches(cell[c]) || checked[cell[c].id]) continue;
      checked[cell[c].id] = true;
      entity.checkWith(cell[c]);
    }
    cell.push(entity);
  }
}
