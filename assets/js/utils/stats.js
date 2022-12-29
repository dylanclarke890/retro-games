class ColorScheme {
  constructor(bg, fg) {
    this.bg = bg;
    this.fg = fg;
  }
}

class Color {
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

class Stats {
  static panelWidth = 74;
  static panelHeight = 30;
  static containerWidth = 80;
  static containerHeight = 50;
  static colorSchemes = {
    fps: new ColorScheme(new Color(16, 16, 48), new Color(0, 255, 255)),
    ms: new ColorScheme(new Color(16, 48, 16), new Color(0, 255, 0)),
    mem: new ColorScheme(new Color(48, 16, 26), new Color(255, 0, 128)),
  };

  #currentPanelIndex = 0;
  #maxPanels = 2;

  constructor({ domElementStyles, appendTo } = {}) {
    this.domElementStyles = domElementStyles;
    this.appendTo = appendTo;
    this.#setup();
  }

  #setup() {
    this.DOMElements = {};

    const parent = document.createElement("div");
    this.#assignStyles(parent, {
      fontFamily: "Helvetica, Arial, sans-serif",
      textAlign: "left",
      fontSize: "9px",
      opacity: "0.9",
      width: `${Stats.containerWidth}px`,
      height: `${Stats.containerHeight}px`,
      cursor: "pointer",
    });
    parent.addEventListener("click", () => this.#nextPanel());
    if (this.domElementStyles) this.#assignStyles(parent, this.domElementStyles);
    if (this.appendTo) this.appendTo.appendChild(parent);
    this.DOMElements.parent = parent;

    this.#createPanel("fps", true);
    this.#createPanel("ms", false);

    try {
      if (performance && performance.memory.totalJSHeapSize) {
        this.#createPanel("mem", false);
        this.#maxPanels = 3;
      }
    } catch (ex) {}

    this.minFps = 1000;
    this.maxFps = 0;
    this.minMs = 1000;
    this.maxMs = 0;
    this.minMem = 1000;
    this.maxMem = 0;
    this.framesThisSec = 0;
    this.now = performance.now();
    this.last = this.now;
    this.lastFrame = this.now;
  }

  #assignStyles(element, styles) {
    for (const styleName in styles) {
      element.style[styleName] = styles[styleName];
    }
  }

  #drawPanelData(data, minVal, colorScheme) {
    for (let i = 0; i < 30; i++)
      for (let j = 0; j < 73; j++) {
        const L = (j + i * 74) * 4;
        data[L] = data[L + 4];
        data[L + 1] = data[L + 5];
        data[L + 2] = data[L + 6];
      }

    for (let i = 0; i < 30; i++) {
      const L = (73 + i * 74) * 4;
      if (i < minVal) {
        data[L] = colorScheme.bg.r;
        data[L + 1] = colorScheme.bg.g;
        data[L + 2] = colorScheme.bg.b;
      } else {
        data[L] = colorScheme.fg.r;
        data[L + 1] = colorScheme.fg.g;
        data[L + 2] = colorScheme.fg.b;
      }
    }
  }

  #panelContainer(panelColor, display, appendTo) {
    const div = document.createElement("div");
    this.#assignStyles(div, {
      backgroundColor: `rgb(${Math.floor(Stats.colorSchemes[panelColor].bg.r / 2)},${Math.floor(
        Stats.colorSchemes[panelColor].bg.g / 2
      )},${Math.floor(Stats.colorSchemes[panelColor].bg.b / 2)})`,
      padding: "2px 0px 3px 0px",
      display,
      height: `${Stats.containerHeight}px`,
      boxSizing: "border-box",
    });
    appendTo.appendChild(div);
    return div;
  }

  #panelText(panelType, appendTo) {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${panelType.toUpperCase()}</strong>`;
    this.#assignStyles(div, {
      color: `rgb(${Stats.colorSchemes[panelType].fg.r},${Stats.colorSchemes[panelType].fg.g},${Stats.colorSchemes[panelType].fg.b})`,
      margin: "0px 0px 1px 3px",
    });
    appendTo.appendChild(div);
    return div;
  }

  #panelCanvas(bgColor, appendTo) {
    const canv = document.createElement("canvas");
    canv.width = Stats.panelWidth;
    canv.height = Stats.panelHeight;
    this.#assignStyles(canv, { display: "block", marginLeft: "3px" });
    appendTo.appendChild(canv);

    const ctx = canv.getContext("2d");
    ctx.fillStyle = `rgb(${bgColor.r},${bgColor.g},${bgColor.b})`;
    ctx.fillRect(0, 0, canv.width, canv.height);
    const data = ctx.getImageData(0, 0, canv.width, canv.height);

    return [ctx, data];
  }

  #createPanel(name, isFirst) {
    const display = isFirst ? "block" : "none";
    const div = this.#panelContainer(name, display, this.DOMElements.parent);
    this.DOMElements[name] = {};
    this.DOMElements[name].div = div;
    this.DOMElements[name].text = this.#panelText(name, div);
    const [ctx, data] = this.#panelCanvas(Stats.colorSchemes[name].bg, div);
    this.DOMElements[name].ctx = ctx;
    this.DOMElements[name].data = data;
  }

  #nextPanel() {
    const { fps, ms, mem } = this.DOMElements;
    this.#currentPanelIndex =
      ++this.#currentPanelIndex == this.#maxPanels ? 0 : this.#currentPanelIndex;

    fps.div.style.display = "none";
    ms.div.style.display = "none";
    if (this.#maxPanels === 3) mem.div.style.display = "none";

    switch (this.#currentPanelIndex) {
      case 0:
        fps.div.style.display = "block";
        break;
      case 1:
        ms.div.style.display = "block";
        break;
      case 2:
        if (this.#maxPanels === 3) mem.div.style.display = "block";
        break;
      default:
        throw Error("Panel index out of range.");
    }
  }

  update() {
    const { ms, fps, mem } = this.DOMElements;
    this.now = performance.now();
    this.framesThisSec++;

    // Interval between frames in ms.
    const msValue = Math.round(this.now - this.last);
    this.last = this.now;
    this.minMs = Math.min(this.minMs, msValue);
    this.maxMs = Math.max(this.maxMs, msValue);
    this.#drawPanelData(
      ms.data.data,
      Math.min(30, 30 - (msValue / 200) * 30),
      Stats.colorSchemes.ms
    );
    ms.text.innerHTML = `<strong>${msValue} MS</strong>(${this.minMs}-${this.maxMs})`;
    ms.ctx.putImageData(ms.data, 0, 0);

    if (this.now < this.lastFrame + 1000) return; // exit early if less than a second since last update.

    // Calculating FPS.
    const fpsValue = Math.round((this.framesThisSec * 1000) / (this.now - this.lastFrame));
    this.minFps = Math.min(this.minFps, fpsValue);
    this.maxFps = Math.max(this.maxFps, fpsValue);
    this.#drawPanelData(
      fps.data.data,
      Math.min(30, 30 - (fpsValue / 100) * 30),
      Stats.colorSchemes.fps
    );
    fps.text.innerHTML = `<strong>${fpsValue} FPS</strong> (${this.minFps}-${this.maxFps})`;
    fps.ctx.putImageData(fps.data, 0, 0);

    this.lastFrame = this.now;
    this.framesThisSec = 0;
    if (this.#maxPanels !== 3) return;

    // Calculating size of memory used by the heap.
    const memValue = Math.round(performance.memory.usedJSHeapSize * 9.54e-7);
    this.minMem = Math.min(this.minMem, memValue);
    this.maxMem = Math.max(this.maxMem, memValue);
    this.#drawPanelData(mem.data.data, Math.min(30, 30 - memValue / 2), Stats.colorSchemes.mem);
    mem.text.innerHTML = `<strong>${memValue} MEM</strong> (${this.minMem}-${this.maxMem})`;
    mem.ctx.putImageData(mem.data, 0, 0);
  }
}
