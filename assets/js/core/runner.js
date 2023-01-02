class GameRunner {
  #resources = [];
  ready = false;

  constructor(canvasId, gameClass, fps, width, height, scale, loaderClass) {
    this.system = new System({ canvasId, width, height, scale, fps });
    this.userAgent = UserAgent.info;
    this.inputEvents = new InputEvents();
    this.soundManager = new SoundManager();
    this.loader = new (loaderClass || Loader)(gameClass);
    this.ready = true;
  }

  addResource(resource) {
    if (resource) this.#resources.push(resource);
  }
}
// ig.main = function (canvasId, gameClass, fps, width, height, scale, loaderClass) {
//   ig.system = new ig.System(canvasId, fps, width, height, scale || 1);
//   ig.input = new ig.Input();
//   ig.soundManager = new ig.SoundManager();
//   ig.music = new ig.Music();
//   ig.ready = true;

//   var loader = new (loaderClass || ig.Loader)(gameClass, ig.resources);
//   loader.load();
// };