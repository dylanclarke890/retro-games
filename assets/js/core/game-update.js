class GameUpdater {
  constructor(scope) {
    this.scope = scope;
  }

  update(tframe) {
    const scope = this.scope;

    // Calling entity render methods
    if (scope.state["entities"] !== undefined)
      for (let entity in scope.state.entities) scope.state.entities[entity].update();

    return state;
  }
}
