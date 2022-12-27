class Game {
  constructor() {
    this.viewport = generateCanvas(500, 500);
    this.ctx = this.viewport.getContext("2d");
    document.body.insertBefore(this.viewport, document.body.firstChild);
    this.ctx.font = "32px Arial";
    this.ctx.fillText("We have begun.", 5, 50, 800);
  }
}

window.game = new Game();
