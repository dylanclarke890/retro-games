class AltFont {
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

  draw(text, x, y, align) {
    if (typeof text !== "string") text = text.toString();
    // if (this.#isMultiline(text)) {
    //   const lines = text.split("\n");
    //   const lineHeight = this.heightForString(text);
    //   for (let i = 0; i < lines.length; i++) this.draw(lines[i], x, y + i * lineHeight, align);
    //   return;
    // }

    // const width = this.#widthForLine(text);
    // if (align === Font.ALIGN.CENTER) x -= width / 2;
    // else if (align === Font.ALIGN.RIGHT) x -= width;

    const ctx = this.system.ctx;
    // if (this.alpha !== 1) ctx.globalAlpha = this.alpha;
    ctx.font = `72px ${this.name}`;
    ctx.fillStyle = `black`;
    ctx.fillText(text, x, y);
    // for (let i = 0; i < text.length; i++)
    //   x += this.#drawChar(text.charCodeAt(i) - this.firstChar, x, y);

    // if (this.alpha !== 1) ctx.globalAlpha = 1;
    // ig.Image.drawCount += text.length; TODO
  }
}
