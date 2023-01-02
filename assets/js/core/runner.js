class GameRunner {
  resources = [];
  ready = false;
  game = null;

  constructor({
    canvasId,
    gameClass,
    fps,
    width,
    height,
    scale,
    loaderClass,
    ...customOptions
  } = {}) {
    this.system = new System({ runner: this, canvasId, width, height, scale, fps });
    this.customOptions = customOptions;
    this.userAgent = UserAgent.info;
    this.mediaFactory = new MediaFactory({ system: this.system });
    this.soundManager = new SoundManager(this);
    this.inputEvents = new InputEvents();
    this.ready = true;

    this.loader = new (loaderClass ?? GameLoader)({
      system: this.system,
      gameClass,
      resources: this.resources,
    });
    this.loader.load();
  }

  addResource(resource) {
    if (resource) this.resources.push(resource);
  }
}

class MyGame extends AltGame {
  constructor({ ...options } = {}) {
    super(options);
    this.font = this.mediaFactory.createFont("../../fonts/04b03.font.png");
  }

  update() {
    super.update();
  }

  draw() {
    super.draw();

    const x = 50,
      y = 100;

    this.font.draw("It Works!", x, y, Font.ALIGN.CENTER);
  }
}

const runner = new GameRunner({
  canvasId: "play-area",
  gameClass: MyGame,
  fps: 60,
  width: 800,
  height: 600,
});

// ig.main = function (canvasId, gameClass, fps, width, height, scale, loaderClass) {
//   ig.system = new ig.System(canvasId, fps, width, height, scale || 1);
//   ig.input = new ig.Input();
//   ig.soundManager = new ig.SoundManager();
//   ig.music = new ig.Music();
//   ig.ready = true;

//   var loader = new (loaderClass || ig.Loader)(gameClass, ig.resources);
//   loader.load();
// };
