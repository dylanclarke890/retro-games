import { GameLoader } from "../core/loader.js";

export class PreLoader extends GameLoader {
  imageObj = null;

  constructor(gameClass, resources) {
    super(gameClass, resources);
    this.imageObj = new Image();
    this.imageObj.src = "media/main_loader.png"; // image here
  }

  draw() {
    // Add your drawing code here
    const { ctx, width, height, scale } = this.system;
    ctx.drawImage(this.imageObj, 0, 0);

    this._drawStatus += (this.status - this._drawStatus) / 5;
    const s = scale;
    const w = width * 0.6;
    const h = height * 0.03;
    const x = width * 0.5 - w / 2;
    const y = height * 0.85 - h / 2;

    ctx.fillStyle = "#fff)";
    ctx.fillRect(x * s, y * s, w * s, h * s);

    ctx.fillStyle = "#000";
    ctx.fillRect(x * s + s, y * s + s, w * s - s - s, h * s - s - s);

    ctx.fillStyle = "#fff";
    ctx.fillRect(x * s, y * s, w * s * this._drawStatus, h * s);
  }
}
