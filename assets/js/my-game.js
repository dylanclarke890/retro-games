class MyGame extends Game {
  constructor({ ...options } = {}) {
    super(options);
  }

  update() {
    super.update();
    /** Extra draw logic goes here. */
  }

  draw() {
    super.draw();
    /** Extra draw logic goes here. */
    const { width, height, offsetWidth } = this.system.canvas;
    const ctx = this.system.ctx;
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, width, height);
    this.font.draw("It Works!", offsetWidth / 2, 100, {
      align: Font.ALIGN.CENTER,
      alpha: 0.5,
      color: "green",
    });
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
    name: "arcadeclassic",
    path: "./assets/fonts/arcade-classic.TTF",
  },
});
