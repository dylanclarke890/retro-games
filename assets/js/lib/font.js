class Font {
  static ALIGN = {
    LEFT: 0,
    RIGHT: 1,
    CENTER: 2,
  };

  align = null;
  alpha = 1;
  color = null;
  size = null;

  constructor({ system, name, path } = {}) {
    Guard.againstNull({ system });
    this.system = system;
    this.name = name ?? NativeExtensions.uniqueId();
    this.path = path;
    this.loaded = false;
    this.failed = false;
    this.load();
    this.loadCallback = (_path, _wasSuccessful) => {};
  }

  load(loadCallback) {
    if (!this.loaded && this.system.ready) {
      this.loadCallback = loadCallback || ((_, _) => {});
      const fontFace = new FontFace(this.name, `url(${this.path})`);
      document.fonts.add(fontFace);
      this.data = fontFace;
      this.data.load().then(
        () => this.onload(),
        (err) => this.onerror(err)
      );
    } else if (this.loaded) this.loadCallback(this.path, true);
    else Register.preloadFont(this);
  }

  onload() {
    this.loaded = true;
    this.loadCallback(this.path, true);
  }

  onerror(_err) {
    this.failed = true;
    this.loadCallback(this.path, false);
  }

  sizeOf(text) {
    return this.system.ctx.measureText(text);
  }

  write(text, x, y, opts = {}) {
    if (typeof text !== "string") text = text.toString();

    let { align, alpha, color, size } = opts;
    align = align ?? this.align ?? Font.ALIGN.LEFT;
    alpha = alpha ?? this.alpha ?? 1;
    color = color ?? this.color ?? "black";
    size = size ?? this.size ?? 36;

    if (align !== Font.ALIGN.LEFT) {
      const textWidth = this.sizeOf(text).width;
      if (align === Font.ALIGN.CENTER) x -= textWidth / 2;
      else if (align === Font.ALIGN.RIGHT) x -= textWidth;
    }

    const ctx = this.system.ctx;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    ctx.font = `${size}px ${this.name}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  }
}
