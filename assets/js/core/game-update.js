function gameUpdate(scope) {
  return function update(tFrame) {
    const state = scope.state || {};
    if (state.hasOwnProperty("entities")) {
      const entities = state.entities;
      for (let entity in entities) {
        entities[entity].update();
      }
    }

    return state;
  };
}
