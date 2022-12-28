class GameUpdater {
  constructor(scope) {
    this.scope = scope;
  }

  update(tframe) {
    const scope = this.scope;
    const state = scope.state || {};
    if (state.hasOwnProperty("entities")) {
      const entities = state.entities;
      for (let entity in entities) entities[entity].update();
    }

    return state;
  }
}
