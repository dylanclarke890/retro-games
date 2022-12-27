class Game {
  constructor() {
    this.viewport = document.createElement("canvas");
    this.ctx = this.viewport.getContext("2d");
    this.viewport.width = 800;
    this.viewport.height = 600;
    document.body.insertBefore(this.viewport, document.body.firstChild);
    // Toss some text into our canvas
    this.ctx.font = "32px Arial";
    this.ctx.fillText("We have begun.", 5, 50, 800);
  }
}

window.game = new Game();
