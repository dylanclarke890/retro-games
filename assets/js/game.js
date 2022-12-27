class Game {
  constructor(w, h, targetFps, showFps) {
    this.constants = {
      w,
      h,
      targetFps,
      showFps,
    };
    this.state = {};
    this.viewport = generateCanvas(w, h);
    this.ctx = this.viewport.getContext("2d");

    //#region Remove later
    document.body.insertBefore(this.viewport, document.body.firstChild);
    this.ctx.font = "32px Arial";
    this.ctx.fillText("We have begun.", 5, 50, 800);
    //#endregion Remove later
  }
}

window.game = new Game(800, 600, 60, true);
