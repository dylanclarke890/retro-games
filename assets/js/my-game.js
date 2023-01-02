class MyGame extends Game {
  constructor({ ...options } = {}) {
    super(options);
  }

  update() {
    super.update();
  }

  draw() {
    super.draw();
    const { width, height, offsetWidth } = this.system.canvas;
    const ctx = this.system.ctx;
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, width, height);
    this.font.draw("It Works!", offsetWidth / 2, 100, Font.ALIGN.CENTER);
  }
}

const runner = new GameRunner({
  canvasId: "play-area",
  gameClass: MyGame,
  fps: 60,
  width: 800,
  height: 600,
  showDebugStats: true,
  font: {
    name: "FontFamily Bitter",
    path: "https://fonts.gstatic.com/s/bitter/v7/HEpP8tJXlWaYHimsnXgfCOvvDin1pK8aKteLpeZ5c0A.woff2",
  },
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
