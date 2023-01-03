class MyGame extends Game {
  clearColor = "black";
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
  width: 768,
  height: 624,
  showDebugStats: true,
  font: {
    path: "./assets/fonts/arcade-classic.TTF",
  },
});
