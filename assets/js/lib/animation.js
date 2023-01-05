class GameAnimationSheet {
  width = 0;
  height = 0;
  image = null;

  constructor({ path, size = {}, system }) {
    Guard.againstNull({ system });
    this.width = size.x ?? 8;
    this.height = size.y ?? 8;
    this.image = new GameImage({ system, path });
  }

  get system() {
    return this.image.system;
  }
}

class GameAnimation {
  sheet = null;
  timer = null;

  sequence = [];
  flip = { x: false, y: false };
  pivot = { x: 0, y: 0 };

  frameTime = 0;
  frame = 0;
  tile = 0;
  stop = false;
  loopCount = 0;
  alpha = 1;
  angle = 0;

  constructor(sheet, frameTime, sequence, stop) {
    this.sheet = sheet;
    this.pivot = { x: sheet.width / 2, y: sheet.height / 2 };
    this.timer = new Timer();

    this.frameTime = frameTime;
    this.sequence = sequence;
    this.stop = !!stop;
    this.tile = this.sequence[0];
  }

  rewind() {
    this.timer.set();
    this.loopCount = 0;
    this.frame = 0;
    this.tile = this.sequence[0];
    return this;
  }

  gotoFrame(f) {
    // Offset the timer by one tenth of a millisecond to make sure we
    // jump to the correct frame and circumvent rounding errors
    this.timer.set(this.frameTime * -f - 0.0001);
    this.update();
  }

  gotoRandomFrame() {
    this.gotoFrame(Math.floor(Math.random() * this.sequence.length));
  }

  update() {
    const frameTotal = Math.floor(this.timer.delta() / this.frameTime);
    this.loopCount = Math.floor(frameTotal / this.sequence.length);
    if (this.stop && this.loopCount > 0) this.frame = this.sequence.length - 1;
    else this.frame = frameTotal % this.sequence.length;
    this.tile = this.sequence[this.frame];
  }

  draw(targetX, targetY) {
    const bbsize = Math.max(this.sheet.width, this.sheet.height);
    const { width, height, ctx, drawPosition } = this.sheet.system;
    // Exit early if not on screen.
    if (targetX > width || targetY > height || targetX + bbsize < 0 || targetY + bbsize < 0) return;

    if (this.alpha !== 1) ctx.globalAlpha = this.alpha;
    if (this.angle === 0) {
      this.sheet.image.drawTile(
        targetX,
        targetY,
        this.tile,
        this.sheet.width,
        this.sheet.height,
        this.flip.x,
        this.flip.y
      );
    } else {
      ctx.save();
      ctx.translate(drawPosition(targetX + this.pivot.x), drawPosition(targetY + this.pivot.y));
      ctx.rotate(this.angle);
      this.sheet.image.drawTile(
        -this.pivot.x,
        -this.pivot.y,
        this.tile,
        this.sheet.width,
        this.sheet.height,
        this.flip.x,
        this.flip.y
      );
      ctx.restore();
    }
    if (this.alpha !== 1) ctx.globalAlpha = 1;
  }
}
