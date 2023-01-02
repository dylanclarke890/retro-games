class GameLoader {
  gameClass = null;
  status = 0;
  done = false;

  #drawStatus = 0;
  #resources = [];
  #unloaded = [];
  #intervalId = 0;

  constructor({ runner, system, gameClass, resources }) {
    if (!runner) throw new Error("Runner is required.");
    if (!system) throw new Error("System is required.");
    if (!gameClass) throw new Error("Please pass the class type of the game to load");
    if (!(gameClass.prototype instanceof Game))
      throw new Error("Please pass a class that has derived from the 'Game' class.");

    this.runner = runner;
    this.system = system;
    this.gameClass = gameClass;
    this.#resources = resources ?? [];
    for (let i = 0; i < this.#resources.length; i++) this.#unloaded.push(this.#resources[i].path);
  }

  load() {
    this.system.clear("#000");
    if (!this.#resources.length) {
      this.end();
      return;
    }
    for (let i = 0; i < this.#resources.length; i++) this.loadResource(this.#resources[i]);
    this.#intervalId = setInterval(() => this.drawLoadingScreen(), 16);
  }

  loadResource(res) {
    res.load((path, status) => this.#loadCallback(path, status));
  }

  end() {
    if (this.done) return;
    this.done = true;
    clearInterval(this.#intervalId);
    this.runner.setGame(this.gameClass);
  }

  // TODO: Check this.
  drawLoadingScreen() {
    this.#drawStatus += (this.status - this.#drawStatus) / 5;
    const system = this.system;
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
    system.ctx.fillRect(x, y, width * this.#drawStatus, height);
  }

  #loadCallback(path, status) {
    if (status) this.#unloaded.erase(path);
    else throw new Error(`Failed to load resource: ${path}`);
    this.status = 1 - this.#unloaded.length / this.#resources.length;
    if (this.#unloaded.length == 0) setTimeout(() => this.end(), 250); // all done?
  }
}
