class GameLoader {
  done = false;
  #gameClass = null;
  #runner = null;
  #status = 0;
  #progressPercent = 0;
  #intervalId = 0;
  #unloaded = [];
  #assetsToPreload = [];

  constructor({ runner, gameClass }) {
    Guard.againstNull({ runner });
    Guard.againstNull({ gameClass }).isInstanceOf(Game);

    this.#runner = runner;
    this.#gameClass = gameClass;
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
    if (this.done) return;
    this.done = true;
    clearInterval(this.#intervalId);
    this.#runner.setGame(this.#gameClass);
    Register.clearPreloadCache();
  }

  #drawLoadingScreen() {
    this.#progressPercent += (this.#status - this.#progressPercent) / 5;
    const system = this.#runner.system;
    const scale = system.scale;
    let width = (system.width * 0.6).floor();
    let height = (system.height * 0.1).floor();
    const x = (system.width * 0.5 - width / 2).floor() * scale;
    const y = (system.height * 0.5 - height / 2).floor() * scale;
    width = width * scale;
    height = height * scale;

    system.ctx.fillStyle = "#000";
    system.ctx.fillRect(0, 0, system.width, system.height);
    system.ctx.fillStyle = "#fff";
    system.ctx.fillRect(x, y, width, height);
    system.ctx.fillStyle = "#000";
    system.ctx.fillRect(x + scale, y + scale, width - scale - scale, height - scale - scale);
    system.ctx.fillStyle = "#fff";
    system.ctx.fillRect(x, y, width * this.#progressPercent, height);
  }

  #loadCallback(path, wasSuccessful) {
    if (!wasSuccessful) throw new Error(`Failed to load resource: ${path}`);
    this.#unloaded.erase(path);
    this.#status = 1 - this.#unloaded.length / this.#assetsToPreload.length;
    if (this.#unloaded.length === 0) setTimeout(() => this.#end(), 250);
  }
}
