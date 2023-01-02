class GameUpdater {
  constructor({ runner }) {
    if (!runner) throw new Error("Runner is required");
    this.runner = runner;
  }

  update(tframe) {
    const game = this.runner;

    // Calling entity render methods
    if (game.entities !== undefined) for (let entity in game.entities) entity.update();
    return game.state;
  }
}
