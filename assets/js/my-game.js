class MyGame extends Game {
  constructor({ ...options } = {}) {
    super(options);
    this.loadLevel(levelOne);
  }

  update() {
    super.update();
    /** Extra draw logic goes here. */
  }

  draw() {
    super.draw();

    /** Extra draw logic goes here. */
    // this.system.clear("lightblue")
    const { offsetWidth } = this.system.canvas;
    this.font.write("It Works!", offsetWidth / 2, 100, {
      align: Font.ALIGN.CENTER,
      alpha: 1,
      color: "green",
      size: 80,
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
