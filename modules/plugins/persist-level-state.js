import { Game } from "../core/game.js";
import { plugin } from "../lib/inject.js";

/**
 * Contains functions to persist entity state
 * @class
 */
export class Persistence {
  static globalLoadFunctions = [];
  static globalSaveFunctions = [];

  static {
    const gameOverrides = [
      {
        name: "removeEntity",
        value: function (entity) {
          if (!entity.persist || entity._killed) {
            this.base(entity);
            return;
          }

          if (!this.persistence.killedEntities) this.persistence.killedEntities = [];
          this.persistence.killedEntities.push(entity);
          this.base(entity);
        },
      },
    ];

    plugin(gameOverrides).to(Game);
  }

  /**
   * Initializes a new Persistence system
   * @constructs
   */
  constructor() {
    this.stateLoadFunctions = Persistence.globalLoadFunctions.slice(0);
    this.stateSaveFunctions = Persistence.globalSaveFunctions.slice(0);
  }

  /**
   * Finds all persistable objects and returns an array with their state
   * @returns {Array}
   */
  getLevelState() {
    let levelState = false;

    const gameEntities = this.game.entities.slice(0);
    const entities = this.killedEntities ? gameEntities.concat(this.killedEntities) : gameEntities;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (!entity.persist) continue;
      const eid = this.getEntityIdentifier(entity);
      if (!eid) continue;

      const entityState = {
        id: eid,
        x: entity.pos.x,
        y: entity.pos.y,
      };

      if (entity._killed || entity.isKilled) entityState.killed = 1;
      this.runStateHandlers("Save", entity, entityState);

      if (entity.persistenceSave) entity.persistenceSave(entityState);
      if (!levelState) levelState = [];

      levelState.push(entityState);
    }

    return levelState;
  }

  /**
   * Finds all persistable objects and returns an array with their state
   * @param	{Array}	Array of states computed from getLevelState
   * @returns {Number} Count of how many objects were restored using state passed in
   */
  loadLevelState(levelState) {
    const entities = this.game.entities;

    this.killedEntities = [];
    let loadCount = 0;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (!entity.persist) continue;
      entity.originPersistId = {
        x: entity.pos.x,
        y: entity.pos.y,
      };

      if (levelState) if (this.loadEntityState(entity, levelState)) loadCount++;
    }

    return loadCount;
  }

  /**
   * Restores a single object using a state array
   * @param	{Entity} entity		Single entity to restore
   * @param	{Array}		levelState	Array of states computed from getLevelState
   * @returns {Number}	Count of how many objects were restored using state passed in
   */
  loadEntityState(entity, levelState) {
    const eid = this.getEntityIdentifier(entity);
    for (let s = 0; s < levelState.length; s++) {
      const levelStateItem = levelState[s];
      if (levelStateItem.id !== eid) continue;
      this.runStateHandlers("Load", entity, levelStateItem);
      if (entity.persistenceLoad) entity.persistenceLoad(levelStateItem);

      for (const key in levelStateItem) {
        if (key in levelStateItem) {
          const value = levelStateItem[key];
          if (key === "id") entity.idPersisted = value;
          else if (key === "x") entity.pos.x = value;
          else if (key === "y") entity.pos.y = value;
          else if (key === "killed") this.game.removeEntity(entity);
          else entity[key] = value;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Computes a identifier used to restore an object
   * @param	{Entity} entity An entity to get an identifier
   * @returns {String}
   */
  getEntityIdentifier(entity) {
    const pos = entity.originPersistId || entity.pos;
    return `x_${pos.x}_y_${pos.y}`;
  }

  /**
   * Calls all functions assigned to handle persistence
   * @param	{"Save" | "Load"} name Event name (Load, Save)
   * @param	{Entity} entity	Entity context
   * @param	{Object} state State data (single object)
   * @returns {undefined}
   */
  runStateHandlers(name, entity, state) {
    const list = this["state" + name + "Functions"];
    if (!list) return;
    for (let i = 0; i < list.length; i++) list[i].call(entity, state);
  }
}
