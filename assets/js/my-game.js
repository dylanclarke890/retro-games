class MyGame extends Game {
  constructor({ ...options } = {}) {
    super(options);
    this.font = this.mediaFactory.createFont("../../fonts/04b03.font.png");
  }

  update() {
    super.update();
  }

  draw() {
    super.draw();

    // const x = 50,
    //   y = 100;
    // this.font.draw("It Works!", x, y, Font.ALIGN.CENTER);
  }
}

const runner = new GameRunner({
  canvasId: "play-area",
  gameClass: MyGame,
  fps: 60,
  width: 800,
  height: 600,
  showDebugStats: true,
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
