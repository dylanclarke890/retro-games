class Undo {
  static TYPE = {
    MAP_DRAW: 1,
    ENTITY_EDIT: 2,
    ENTITY_CREATE: 3,
    ENTITY_DELETE: 4,
  };

  levels = null;
  chain = [];
  rpos = 0;
  currentAction = null;

  constructor(levels) {
    this.levels = levels || 10;
  }

  clear() {
    this.chain = [];
    this.currentAction = null;
  }

  commit(action) {
    if (this.rpos) {
      this.chain.splice(this.chain.length - this.rpos, this.rpos);
      this.rpos = 0;
    }
    action.activeLayer = ig.game.activeLayer ? ig.game.activeLayer.name : ""; // TODO
    this.chain.push(action);
    if (this.chain.length > this.levels) this.chain.shift();
  }

  undo() {
    const action = this.chain[this.chain.length - this.rpos - 1];
    if (!action) return;
    this.rpos++;
    // TODO
    ig.game.setActiveLayer(action.activeLayer);

    const { MAP_DRAW, ENTITY_EDIT, ENTITY_CREATE, ENTITY_DELETE } = Undo.TYPE;
    switch (action.type) {
      case MAP_DRAW:
        for (let i = 0; i < action.changes.length; i++) {
          const change = action.changes[i];
          change.layer.setTile(change.x, change.y, change.old);
        }
        break;
      case ENTITY_EDIT:
        action.entity.pos.x = action.old.x;
        action.entity.pos.y = action.old.y;
        action.entity.size.x = action.old.w;
        action.entity.size.y = action.old.h;
        // TODO
        ig.game.entities.selectEntity(action.entity);
        ig.game.entities.loadEntitySettings();
        break;
      case ENTITY_CREATE:
        // TODO
        ig.game.entities.removeEntity(action.entity);
        ig.game.entities.selectEntity(null);
        break;
      case ENTITY_DELETE:
        // TODO
        ig.game.entities.entities.push(action.entity);
        if (action.entity.name) ig.game.entities.namedEntities[action.entity.name] = action.entity;
        ig.game.entities.selectEntity(action.entity);
        break;
      default:
        throw new Error(`Unexpected undo type: ${action.type}`);
    }

    // TODO
    ig.game.setModified();
  }

  redo() {
    if (!this.rpos) return;

    const action = this.chain[this.chain.length - this.rpos];
    if (!action) return;
    this.rpos--;

    ig.game.setActiveLayer(action.activeLayer); // TODO

    const { MAP_DRAW, ENTITY_EDIT, ENTITY_CREATE, ENTITY_DELETE } = Undo.TYPE;
    switch (action.type) {
      case MAP_DRAW:
        // TODO
        for (let i = 0; i < action.changes.length; i++) {
          const change = action.changes[i];
          change.layer.setTile(change.x, change.y, change.current);
        }
        break;
      case ENTITY_EDIT:
        // TODO
        action.entity.pos.x = action.current.x;
        action.entity.pos.y = action.current.y;
        action.entity.size.x = action.current.w;
        action.entity.size.y = action.current.h;
        ig.game.entities.selectEntity(action.entity);
        ig.game.entities.loadEntitySettings();
        break;
      case ENTITY_CREATE:
        // TODO
        ig.game.entities.entities.push(action.entity);
        if (action.entity.name) {
          ig.game.entities.namedEntities[action.entity.name] = action.entity;
        }
        break;
      case ENTITY_DELETE:
        // TODO
        ig.game.entities.removeEntity(action.entity);
        ig.game.entities.selectEntity(null);
        break;
      default:
        throw new Error(`Unexpected redo type: ${action.type}`);
    }

    // TODO
    ig.game.setModified();
  }

  //#region Map changes

  beginMapDraw() {
    this.currentAction = {
      type: Undo.TYPE.MAP_DRAW,
      time: performance.now(),
      changes: [],
    };
  }

  pushMapDraw(layer, x, y, oldTile, currentTile) {
    if (!this.currentAction) return;
    this.currentAction.changes.push({ layer, x, y, old: oldTile, current: currentTile });
  }

  endMapDraw() {
    if (!this.currentAction || !this.currentAction.changes.length) return;
    this.commit(this.currentAction);
    this.currentAction = null;
  }

  //#endregion Map changes

  //#region Entity changes

  beginEntityEdit(entity) {
    this.currentAction = {
      type: Undo.TYPE.ENTITY_EDIT,
      time: performance.now(),
      entity,
      old: {
        x: entity.pos.x,
        y: entity.pos.y,
        w: entity.size.x,
        h: entity.size.y,
      },
      current: {
        x: entity.pos.x,
        y: entity.pos.y,
        w: entity.size.x,
        h: entity.size.y,
      },
    };
  }

  pushEntityEdit(entity) {
    if (!this.currentAction) return;
    this.currentAction.current = {
      x: entity.pos.x,
      y: entity.pos.y,
      w: entity.size.x,
      h: entity.size.y,
    };
  }

  endEntityEdit() {
    const action = this.currentAction;
    if (
      !action ||
      (action.old.x == action.current.x &&
        action.old.y == action.current.y &&
        action.old.w == action.current.w &&
        action.old.h == action.current.h)
    )
      return;
    this.commit(this.currentAction);
    this.currentAction = null;
  }

  commitEntityCreate(entity) {
    this.commit({
      type: Undo.TYPE.ENTITY_CREATE,
      time: performance.now(),
      entity,
    });
  }

  commitEntityDelete(entity) {
    this.commit({
      type: Undo.TYPE.ENTITY_DELETE,
      time: performance.now(),
      entity,
    });
  }

  //#endregion Entity changes
}
