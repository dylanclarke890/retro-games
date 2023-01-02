class GameLoader {
  done = false;
  #gameClass = null;
  #runner = null;
  #status = 0;
  #progressPercent = 0;
  #intervalId = 0;
  #unloaded = [];
  #resources = [];

  constructor({ runner, gameClass, resources }) {
    if (!runner) throw new Error("Runner is required.");
    if (!gameClass) throw new Error("Game class is required.");
    if (!(gameClass.prototype instanceof Game))
      throw new Error("Please pass a class that has extended the 'Game' class.");

    this.#runner = runner;
    this.#gameClass = gameClass;
    this.#resources = resources ?? [];
    for (let i = 0; i < this.#resources.length; i++) this.#unloaded.push(this.#resources[i].path);
  }

  load() {
    this.#runner.system.clear("#000");
    if (!this.#resources.length) {
      this.#end();
      return;
    }
    for (let i = 0; i < this.#resources.length; i++) this.#loadResource(this.#resources[i]);
    this.#intervalId = setInterval(() => this.#drawLoadingScreen(), 16);
  }

  #loadResource(resource) {
    resource.load((path, success) => this.#loadCallback(path, success));
  }

  #end() {
    if (this.done) return;
    this.done = true;
    clearInterval(this.#intervalId);
    this.#runner.setGame(this.#gameClass);
  }

  // FIXME: Progress bar is off center.
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
    this.#status = 1 - this.#unloaded.length / this.#resources.length;
    if (this.#unloaded.length === 0) setTimeout(() => this.#end(), 250);
  }
}
