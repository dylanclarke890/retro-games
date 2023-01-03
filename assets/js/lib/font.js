class Font {
  static ALIGN = {
    LEFT: 0,
    RIGHT: 1,
    CENTER: 2,
  };

  constructor({ system, name, path } = {}) {
    this.system = system;
    this.name = name;
    this.path = path;
    this.loaded = false;
    this.failed = false;
    this.load();
    this.loadCallback = (_path, _wasSuccessful) => {};
  }

  load(loadCallback) {
    if (this.loaded) {
      if (loadCallback) loadCallback(this.path, true);
      return;
    } else if (!this.loaded && this.system.ready) {
      if (loadCallback) this.loadCallback = loadCallback;
      const fontFace = new FontFace(this.name, `url(${this.path})`);
      document.fonts.add(fontFace);
      this.data = fontFace;
      this.data.load().then(
        () => this.onload(),
        (err) => this.onerror(err)
      );
    } else this.system.addResource(this);
  }

  onload() {
    this.loaded = true;
    this.loadCallback(this.path, true);
  }

  onerror(_err) {
    this.failed = true;
    this.loadCallback(this.path, false);
  }

  sizeOfText(text) {
    return this.system.ctx.measureText(text);
  }

  draw(text, x, y, opts = {}) {
    const { align, alpha = 1 } = opts;
    if (typeof text !== "string") text = text.toString();

    if (align !== Font.ALIGN.LEFT) {
      const textWidth = this.sizeOfText(text).width;
      if (align === Font.ALIGN.CENTER) {
        x -= textWidth / 2;
      } else if (align === Font.ALIGN.RIGHT) {
        x -= textWidth;
      }
    }

    const ctx = this.system.ctx;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    ctx.font = `72px ${this.name}`;
    ctx.fillStyle = `black`;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
    
    // ig.Image.drawCount += text.length; TODO
  }
}
