class Game {
  #autoSort = false;
  #backgroundAnims = {};
  #backgroundMaps = [];
  #cellSize = 64;
  #deferredKills = [];
  #doSortEntities = false;
  #entities = [];
  #levelToLoad = null;
  #namedEntities = {};
  #sortBy = Game.SORT.Z_INDEX;

  clearColor = "#000000";
  collisionMap = CollisionMap.staticNoCollision;
  font = null;
  gravity = 0;
  screen = {
    actual: { x: 0, y: 0 },
    rounded: { x: 0, y: 0 },
  };

  static get SORT() {
    return {
      Z_INDEX: (a, b) => a.zIndex - b.zIndex,
      POS_X: (a, b) => a.pos.x + a.size.x - (b.pos.x + b.size.x),
      POS_Y: (a, b) => a.pos.y + a.size.y - (b.pos.y + b.size.y),
    };
  }

  constructor({ system, font, mediaFactory } = {}) {
    Guard.againstNull({ system });
    Guard.againstNull({ mediaFactory });
    this.system = system;
    this.media = mediaFactory;
    this.font = font;
    this.input = new Input({ system: this.system });
    this.#sortBy = this.#sortBy || Game.SORT.Z_INDEX;
  }

  run() {
    this.update();
    this.draw();
  }

  update() {
    this.input.clearPressed();
    if (this.#levelToLoad) {
      this.loadLevel(this.#levelToLoad);
      this.#levelToLoad = null;
    }

    for (let i = 0; i < this.#entities.length; i++) {
      const ent = this.#entities[i];
      if (!ent.killed) ent.update();
    }
    this.checkEntities();

    // remove all killed entities
    for (let i = 0; i < this.#deferredKills.length; i++) {
      this.#deferredKills[i].erase();
      this.#entities.erase(this.#deferredKills[i]);
    }
    this.#deferredKills = [];
    if (this.#doSortEntities || this.#autoSort) this.sortEntities();

    // update background animations
    for (let tileset in this.#backgroundAnims) {
      const anims = this.#backgroundAnims[tileset];
      for (let a in anims) anims[a].update();
    }
  }

  draw() {
    const { drawPosition, scale } = this.system;
    if (this.clearColor) this.system.clear(this.clearColor);

    /**  TODO: This is a bit of a circle jerk. Entities reference game.screen.rounded
     * instead of game.screen.actual when drawing themselves in order to be
     * "synchronized" to the rounded(?) screen position.*/
    this.screen.rounded = {
      x: drawPosition(this.screen.actual.x) / scale,
      y: drawPosition(this.screen.actual.y) / scale,
    };
    let mapIndex;
    for (mapIndex = 0; mapIndex < this.#backgroundMaps.length; mapIndex++) {
      const map = this.#backgroundMaps[mapIndex];
      // All foreground layers are drawn after the entities
      if (map.foreground) break;
      map.setScreenPos(this.screen.actual.x, this.screen.actual.y);
      map.draw();
    }

    for (let i = 0; i < this.#entities.length; i++) this.#entities[i].draw();

    for (mapIndex; mapIndex < this.#backgroundMaps.length; mapIndex++) {
      const map = this.#backgroundMaps[mapIndex];
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
    this.#entities = [];
    this.#namedEntities = {};
    for (let i = 0; i < data.entities.length; i++) {
      const { type, x, y, settings } = data.entities[i];
      this.spawnEntity(type, x, y, settings);
    }
    this.sortEntities();

    // Map Layer
    this.collisionMap = CollisionMap.staticNoCollision;
    this.#backgroundMaps = [];

    data.layer = data.layer || [];
    for (let i = 0; i < data.layer.length; i++) {
      const layer = data.layer[i];
      const shared = { system: this.system, tilesize: layer.tilesize, data: layer.data };
      if (layer.name == "collision") this.collisionMap = new CollisionMap({ ...shared });
      else
        this.#backgroundMaps.push(
          new BackgroundMap({
            anims: this.#backgroundAnims[layer.tilesetName],
            tileset: layer.tilesetName,
            ...shared,
            ...layer,
          })
        );
    }

    // Call post-init ready function on all entities
    for (let i = 0; i < this.#entities.length; i++) this.#entities[i].ready();
  }

  loadLevelDeferred(data) {
    this.#levelToLoad = data;
  }

  getMapByName(name) {
    if (name === "collision") return this.collisionMap;
    for (let i = 0; i < this.#backgroundMaps.length; i++)
      if (this.#backgroundMaps[i].name === name) return this.#backgroundMaps[i];
    return null;
  }

  getEntityByName(name) {
    return this.#namedEntities[name];
  }

  getEntitiesByType(type) {
    const entityClass = Register.getEntityByType(type);
    const a = [];
    for (let i = 0; i < this.#entities.length; i++) {
      const ent = this.#entities[i];
      if (ent instanceof entityClass && !ent.killed) a.push(ent);
    }
    return a;
  }

  spawnEntity(type, x, y, settings) {
    settings = settings || {};
    const entityClass = Register.getEntityByType(type);
    if (!entityClass) throw new Error(`Can't spawn entity of type ${type}`);
    const ent = new entityClass({ x, y, game: this, settings });
    this.#entities.push(ent);
    if (ent.name) this.#namedEntities[ent.name] = ent; // TODO: Register class
    return ent;
  }

  sortEntities() {
    this.#entities.sort(this.#sortBy);
    this.#doSortEntities = false;
  }

  sortEntitiesDeferred() {
    this.#doSortEntities = true;
  }

  removeEntity(ent) {
    if (ent.name) delete this.#namedEntities[ent.name];
    // We can not remove the entity from the entities[] array in the midst
    // of an update cycle, so remember all killed entities and remove
    // them later.
    // Also make sure this entity doesn't collide anymore and won't get
    // updated or checked
    ent.killed = true;
    ent.type = Entity.TYPE.NONE;
    ent.checkAgainst = Entity.TYPE.NONE;
    ent.collides = Entity.COLLIDES.NEVER;
    this.#deferredKills.push(ent);
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
    for (let i = 0; i < this.#entities.length; i++) {
      const entity = this.#entities[i];
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
