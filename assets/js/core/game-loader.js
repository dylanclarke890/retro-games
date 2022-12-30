class GameLoader {
  resources = [];

  gameClass = null;
  status = 0;
  done = false;

  _unloaded = [];
  _drawStatus = 0;
  _intervalId = 0;

  constructor(gameClass, resources) {
    this.gameClass = gameClass;
    this.resources = resources;
    for (let i = 0; i < this.resources.length; i++) this._unloaded.push(this.resources[i].path);
  }

  load() {
    // ig.system.clear( '#000' ); TODO!
    if (!this.resources.length) {
      this.end();
      return;
    }
    for (let i = 0; i < this.resources.length; i++) this.loadResource(this.resources[i]);
    this._intervalId = setInterval(() => this.draw(), 16);
  }

  loadResource(res) {
    res.load(this._loadCallback);
  }

  end() {
    if (this.done) return;
    this.done = true;
    clearInterval(this._intervalId);
    // ig.system.setGame( this.gameClass ); TODO:
  }

  // TODO!
  draw() {
    // this._drawStatus += (this.status - this._drawStatus) / 5;
    // var s = ig.system.scale;
    // var w = (ig.system.width * 0.6).floor();
    // var h = (ig.system.height * 0.1).floor();
    // var x = (ig.system.width * 0.5 - w / 2).floor();
    // var y = (ig.system.height * 0.5 - h / 2).floor();
    // ig.system.context.fillStyle = "#000";
    // ig.system.context.fillRect(0, 0, ig.system.width, ig.system.height);
    // ig.system.context.fillStyle = "#fff";
    // ig.system.context.fillRect(x * s, y * s, w * s, h * s);
    // ig.system.context.fillStyle = "#000";
    // ig.system.context.fillRect(x * s + s, y * s + s, w * s - s - s, h * s - s - s);
    // ig.system.context.fillStyle = "#fff";
    // ig.system.context.fillRect(x * s, y * s, w * s * this._drawStatus, h * s);
  }

  _loadCallback(path, status) {
    if (status) this._unloaded.erase(path);
    else throw new Error(`Failed to load resource: ${path}`);
    this.status = 1 - this._unloaded.length / this.resources.length;
    if (this._unloaded.length == 0) setTimeout(() => this.end(), 250); // all done?
  }
}
