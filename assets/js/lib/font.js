class Font extends GameImage {
  static ALIGN = {
    LEFT: 0,
    RIGHT: 1,
    CENTER: 2,
  };

  widthMap = [];
  indices = [];
  firstChar = 32;
  alpha = 1;
  letterSpacing = 1;
  lineSpacing = 0;

  onload(ev) {
    this.#loadMetrics(this.data);
    this.parent(ev);
    this.height -= 2; // last 2 lines contain no visual data
  }

  #isMultiline(text) {
    return text.indexOf("\n") !== -1;
  }

  widthForString(text) {
    if (this.#isMultiline(text)) {
      const lines = text.split("\n");
      let width = 0;
      for (let i = 0; i < lines.length; i++) width = Math.max(width, this.#widthForLine(lines[i]));
      return width;
    }

    return this.#widthForLine(text);
  }

  #widthForLine(text) {
    let width = 0;
    for (let i = 0; i < text.length; i++)
      width += this.widthMap[text.charCodeAt(i) - this.firstChar];
    if (text.length > 0) width += this.letterSpacing * (text.length - 1);
    return width;
  }

  heightForString(text) {
    return text.split("\n").length * (this.height + this.lineSpacing);
  }

  draw(text, x, y, align) {
    if (typeof text !== "string") text = text.toString();
    if (this.#isMultiline(text)) {
      const lines = text.split("\n");
      const lineHeight = this.heightForString(text);
      for (let i = 0; i < lines.length; i++) this.draw(lines[i], x, y + i * lineHeight, align);
      return;
    }

    const width = this.#widthForLine(text);
    if (align === Font.ALIGN.CENTER) x -= width / 2;
    else if (align === Font.ALIGN.RIGHT) x -= width;

    // TODO
    if (this.alpha !== 1) ig.system.context.globalAlpha = this.alpha;

    for (let i = 0; i < text.length; i++)
      x += this.#drawChar(text.charCodeAt(i) - this.firstChar, x, y);

    if (this.alpha !== 1) ig.system.context.globalAlpha = 1;
    // ig.Image.drawCount += text.length; TODO
  }

  #drawChar(char, targetX, targetY) {
    if (!this.loaded || char < 0 || char >= this.indices.length) return 0;

    const scale = ig.system.scale; // TODO
    const charX = this.indices[char] * scale;
    const charY = 0;
    const charWidth = this.widthMap[char] * scale;
    const charHeight = this.height * scale;
    // TODO
    ig.system.context.drawImage(
      this.data,
      charX,
      charY,
      charWidth,
      charHeight,
      ig.system.getDrawPos(targetX),
      ig.system.getDrawPos(targetY),
      charWidth,
      charHeight
    );

    return this.widthMap[char] + this.letterSpacing;
  }

  #loadMetrics(image) {
    // Draw the bottommost line of this font image into an offscreen canvas
    // and analyze it pixel by pixel.
    // A run of non-transparent pixels represents a character and its width

    this.widthMap = [];
    this.indices = [];

    const px = ig.getImagePixels(image, 0, image.height - 1, image.width, 1); // TODO

    let currentWidth = 0;
    for (let x = 0; x < image.width; x++) {
      const index = x * 4 + 3; // alpha component of this pixel
      if (px.data[index] > 127) currentWidth++;
      else if (px.data[index] < 128 && currentWidth) {
        this.widthMap.push(currentWidth);
        this.indices.push(x - currentWidth);
        currentWidth = 0;
      }
    }
    this.widthMap.push(currentWidth);
    this.indices.push(x - currentWidth);
  }
}
