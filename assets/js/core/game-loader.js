class GameLoader {
  #assetsToPreload = [];
  #debugMode = false;
  #done = false;
  #gameClass = null;
  #intervalId = 0;
  #progressPercent = 0;
  #runner = null;
  #status = 0;
  #unloaded = [];

  constructor({ runner, gameClass, debugMode }) {
    Guard.againstNull({ runner });
    Guard.againstNull({ gameClass }).isInstanceOf(Game);

    this.#runner = runner;
    this.#gameClass = gameClass;
    this.#debugMode = debugMode;
    this.#assetsToPreload = Register.getAssetsToPreload();
    for (let i = 0; i < this.#assetsToPreload.length; i++)
      this.#unloaded.push(this.#assetsToPreload[i].path);
  }

  load() {
    this.#runner.system.clear("#000");
    if (!this.#assetsToPreload.length) {
      this.#end();
      return;
    }
    for (let i = 0; i < this.#assetsToPreload.length; i++)
      this.#assetsToPreload[i].load((path, success) => this.#loadCallback(path, success));
    this.#intervalId = setInterval(() => this.#drawLoadingScreen(), 16);
  }

  #end() {
    if (this.#done) return;
    this.#done = true;
    clearInterval(this.#intervalId);
    if (this.#debugMode) {
      console.debug("Debugger: Loading...");
      this.debugSystem = new DebugSystem({ system: this.#runner.system });
      DebugSystem.injectDebugMethods({
        systemClass: System,
        gameClass: this.#gameClass,
        baseEntityClass: Entity,
        gameLoopClass: GameLoop,
        debugSystemInstance: this.debugSystem,
      });
    }
    this.#runner.setGame(this.#gameClass);
    Register.clearPreloadCache();
  }

  #drawLoadingScreen() {
    this.#progressPercent += (this.#status - this.#progressPercent) / 5;
    const { scale, width, height, ctx } = this.#runner.system;
    let barWidth = (width * 0.6).floor();
    let barHeight = (height * 0.1).floor();
    const x = (width * 0.5 - barWidth / 2).floor() * scale;
    const y = (height * 0.5 - barHeight / 2).floor() * scale;
    barWidth = barWidth * scale;
    barHeight = barHeight * scale;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "#000";
    ctx.fillRect(x + scale, y + scale, barWidth - scale - scale, barHeight - scale - scale);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, barWidth * this.#progressPercent, barHeight);
  }

  #loadCallback(path, wasSuccessful) {
    if (!wasSuccessful) throw new Error(`Failed to load resource: ${path}`);
    this.#unloaded.erase(path);
    this.#status = 1 - this.#unloaded.length / this.#assetsToPreload.length;
    if (this.#unloaded.length === 0) setTimeout(() => this.#end(), 250);
  }
}
