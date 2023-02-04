import { GameAnimation } from "../core/animation.js";
import { Guard } from "../lib/guard.js";
import { Timer } from "../lib/timer.js";

export class ScreenFader {
  defaultOptions = {
    color: { r: 0, g: 0, b: 0, a: 1 },
    fade: "in",
    speed: 1,
    screenWidth: 0,
    screenHeight: 0,
    waitUntilLoaded: true,
    visible: true,
  };
  static globalSpeedFactor = 2 / 3;

  constructor(options, media, system) {
    Guard.againstNull({ media });
    Guard.againstNull({ system });
    this._setOptions(options);

    const isFadingIn = this.options.fade != "out";

    this._alpha = isFadingIn ? 0 : 1; // set the initial alpha value
    this._alphaChange = isFadingIn ? 1 : -1; // set the direction in which alpha changes each frame

    // check if an image is defined. It will be "tiled" across the screen
    if (this.options.tileImagePath) {
      if (isNaN(this.options.tileWidth))
        throw new Error("ScreenFader option for tileWidth is invalid");
      else if (isNaN(this.options.tileHeight))
        throw new Error("ScreenFader option for tileHeight is invalid");

      // Create a 1 cell animation of the tile image, using width and height
      this._sheet = this.media.createAnimationSheet(this.options.tileImagePath, {
        x: this.options.tileWidth,
        y: this.options.tileHeight,
      });
      this._anim = new GameAnimation(this._sheet, 1.0, [0]); // Use a 1 cell animation
      this._anim.alpha = this._alpha; // set the initial alpha of the animation
    }

    if (!isNaN(this.options.delayBefore)) {
      const delayTime = this.options.delayBefore <= 0 ? 0 : this.options.delayBefore;
      if (delayTime > 0) this.timerDelayBefore = new Timer(delayTime);
    }
  }

  draw() {
    if (this.timerDelayAfter && this.timerDelayAfter.delta() > 0) {
      delete this.timerDelayAfter;
      this._callUserCallback();
    }

    if (this.timerDelayBefore)
      if (this.timerDelayBefore.delta() < 0) return;
      else delete this.timerDelayBefore;

    if (!this.options.visible) return;

    if (
      !this.isFinished &&
      (!this._sheet || this._sheet.image.loaded || !this.options.waitUntilLoaded)
    )
      this._fadeAlphaValue();

    if (this._alpha <= 0) return;

    if (this._anim) this.drawImageTiledOnScreen();
    else this.drawColorOnScreen();
  }

  drawImageTiledOnScreen() {
    const totalWidth = this.options.screenWidth,
      totalHeight = this.options.screenHeight,
      tileWidth = this.options.tileWidth,
      tileHeight = this.options.tileHeight;

    let tileX = 0,
      tileY = 0;
    while (tileY < totalHeight) {
      tileX = 0;

      while (tileX < totalWidth) {
        this._anim.draw(tileX, tileY);
        tileX += tileWidth;
      }

      tileY += tileHeight;
    }
  }

  drawColorOnScreen() {
    this.system.clear(this.getColorCssValue());
  }

  getColorCssValue(rgbaObject) {
    const color = rgbaObject || this.options.color;
    let a = (typeof color.a != "undefined" ? color.a : 1) * this._alpha;
    if (a < 0) a = 0;
    else if (a > 1) a = 1;
    return "rgba(" + color.r + "," + color.g + "," + color.b + "," + a + ")";
  }

  finish() {
    if (this.isFinished) return;
    if (this._alphaChange > 0) this._alpha = 1;
    else this._alpha = 0;
    if (this._anim) this._anim.alpha = this._alpha;

    this.isFinished = true;

    if (typeof this.options.callback == "function") {
      const delayTime = isNaN(this.options.delayAfter) ? 0 : this.options.delayAfter;
      if (delayTime > 0) this.timerDelayAfter = new Timer(delayTime);
      else this._callUserCallback();
    }
  }

  _callUserCallback() {
    this.options.callback.call(this.options.context || this);
  }

  _fadeAlphaValue() {
    this._alpha +=
      this._alphaChange * this.options.speed * this.system.tick * ScreenFader.globalSpeedFactor;
    if ((this._alphaChange > 0 && this._alpha >= 1) || (this._alphaChange < 0 && this._alpha <= 0))
      this.finish();
    if (this._anim) this._anim.alpha = this._alpha;
  }

  _setOptions(userOptions) {
    this.options = Object.assign({}, this.defaultOptions);
    if (isNaN(this.options.screenWidth) || this.options.screenWidth <= 0)
      this.options.screenWidth = this.system.width;
    if (isNaN(this.options.screenHeight) || this.options.screenHeight <= 0)
      this.options.screenHeight = this.system.height;
    if (userOptions) Object.assign(this.options, userOptions);
  }
}
