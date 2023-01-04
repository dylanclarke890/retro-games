class MyGame extends Game {
  clearColor = "black";
  constructor({ ...options } = {}) {
    super(options);
    this.inputEvents.bind(InputEvents.KEY.UP_ARROW, "up");
    this.inputEvents.bind(InputEvents.KEY.DOWN_ARROW, "down");
    this.loadLevel(levelOne);
  }

  draw() {
    super.draw();
    /** Extra draw logic goes here. */
    const { offsetWidth } = this.system.canvas;
    this.font.write("It Works!", offsetWidth / 2, 150, {
      align: Font.ALIGN.CENTER,
      alpha: 1,
      color: "green",
      size: 80,
    });
  }

  update() {
    super.update();
    /** Extra update logic goes here. */
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
