import { $new } from "../lib/dom-utils.js";

class PanelColorScheme {
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

export class PerformanceStats {
  static colorSchemes = {
    fps: new PanelColorScheme(new Color(16, 16, 48), new Color(0, 255, 255)),
    ms: new PanelColorScheme(new Color(16, 48, 16), new Color(0, 255, 0)),
    mem: new PanelColorScheme(new Color(48, 16, 26), new Color(255, 0, 128)),
  };

  #containerElementStyles = [];
  #containerHeight = 48;
  #containerWidth = 96;
  #currentPanelIndex = 0;
  #DOMElements = {};
  #firstUpdate = true;
  #maxPanels = 2;
  #panelHeight = 32;
  #panelWidth = 92;
  #target = null;

  framesThisSec = 0;
  last = this.now;
  lastFrame = this.now;
  now = performance.now();
  maxFps = 0;
  minFps = 1000;
  maxMs = 0;
  minMs = 1000;
  maxMem = 0;
  minMem = 1000;

  constructor({ width, height, containerElementStyles, target } = {}) {
    this.#containerElementStyles = containerElementStyles;
    this.#containerHeight = height ?? 48;
    this.#containerWidth = width ?? 96;
    this.#panelHeight = (this.#containerHeight / 3) * 2;
    this.#panelWidth = this.#containerWidth - 4;
    this.#target = target;
    this.#setup();
  }

  #setup() {
    const parent = $new("div");
    this.#assignStyles(parent, {
      cursor: "pointer",
      fontFamily: "Helvetica, Arial, sans-serif",
      fontSize: "9px",
      opacity: "0.9",
      textAlign: "left",
      height: `${this.#containerHeight}px`,
      width: `${this.#containerWidth}px`,
    });
    parent.addEventListener("click", () => this.#nextPanel());
    if (this.#containerElementStyles) this.#assignStyles(parent, this.#containerElementStyles);
    if (this.#target) this.#target.appendChild(parent);
    this.#DOMElements.parent = parent;

    this.#createPanel("fps", true);
    this.#createPanel("ms", false);
    try {
      if (window.performance && performance.memory.totalJSHeapSize) {
        this.#createPanel("mem", false);
        this.#maxPanels = 3;
      }
    } catch (ex) {
      /* empty */
    }

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
    for (const styleName in styles) element.style[styleName] = styles[styleName];
  }

  #drawPanelData(data, minVal, colorScheme) {
    const width = this.#panelWidth;
    const height = this.#panelHeight;

    // moving existing data across one "column"
    for (let i = 0; i < height; i++)
      for (let j = 0; j < width - 1; j++) {
        const currentByte = (j + i * width) * 4;
        data[currentByte] = data[currentByte + 4];
        data[currentByte + 1] = data[currentByte + 5];
        data[currentByte + 2] = data[currentByte + 6];
      }

    // filling in "column" with new data.
    for (let i = 0; i < height; i++) {
      const currentByte = (width - 1 + i * width) * 4;
      if (i < minVal) {
        data[currentByte] = colorScheme.bg.r;
        data[currentByte + 1] = colorScheme.bg.g;
        data[currentByte + 2] = colorScheme.bg.b;
      } else {
        data[currentByte] = colorScheme.fg.r;
        data[currentByte + 1] = colorScheme.fg.g;
        data[currentByte + 2] = colorScheme.fg.b;
      }
    }
  }

  #panelContainer(panelType, display, target) {
    const div = $new("div");
    const { r, g, b } = PerformanceStats.colorSchemes[panelType].bg;
    this.#assignStyles(div, {
      backgroundColor: `rgb(${Math.floor(r / 2)},${Math.floor(g / 2)},${Math.floor(b / 2)})`,
      boxSizing: "border-box",
      display,
      height: `${this.#containerHeight}px`,
      padding: "2px 0px 3px 0px",
    });
    target.appendChild(div);
    return div;
  }

  #panelText(panelType, target) {
    const div = $new("div");
    const { r, g, b } = PerformanceStats.colorSchemes[panelType].fg;
    const current = $new("strong");
    current.textContent = panelType.toUpperCase();
    const range = $new("span");
    div.append(current);
    div.append(range);
    this.#assignStyles(div, {
      color: `rgb(${r},${g},${b})`,
      margin: "0px 0px 1px 3px",
    });
    target.appendChild(div);
    return { current, range };
  }

  #panelCanvas({ r, g, b }, target) {
    const canv = $new("canvas");
    canv.width = this.#panelWidth;
    canv.height = this.#panelHeight;
    this.#assignStyles(canv, { display: "block", marginLeft: "3px" });
    target.appendChild(canv);

    const ctx = canv.getContext("2d");
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, canv.width, canv.height);
    const data = ctx.getImageData(0, 0, canv.width, canv.height);

    return [ctx, data];
  }

  #createPanel(name, isFirst) {
    const display = isFirst ? "block" : "none";
    const div = this.#panelContainer(name, display, this.#DOMElements.parent);
    this.#DOMElements[name] = {};
    this.#DOMElements[name].div = div;
    this.#DOMElements[name].text = this.#panelText(name, div);
    const [ctx, data] = this.#panelCanvas(PerformanceStats.colorSchemes[name].bg, div);
    this.#DOMElements[name].ctx = ctx;
    this.#DOMElements[name].data = data;
  }

  #nextPanel() {
    const { fps, ms, mem } = this.#DOMElements;
    this.#currentPanelIndex =
      ++this.#currentPanelIndex === this.#maxPanels ? 0 : this.#currentPanelIndex;

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
    if (this.#firstUpdate) {
      // Wait for the stats to "warm up" then reset the minimum fps and ms
      // as they will always display 0 as the minimum otherwise.
      this.#firstUpdate = false;
      setTimeout(() => {
        this.minFps = this.maxFps;
        this.minMs = this.maxMs;
      }, 2000);
    }
    const { ms, fps, mem } = this.#DOMElements;
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
      PerformanceStats.colorSchemes.ms
    );
    ms.text.current.textContent = `${msValue} MS `;
    ms.text.range.textContent = ` (${this.minMs}-${this.maxMs})`;
    ms.ctx.putImageData(ms.data, 0, 0);

    if (this.now < this.lastFrame + 1000) return; // exit early if less than a second since last update.

    // Calculating FPS.
    const fpsValue = Math.round((this.framesThisSec * 1000) / (this.now - this.lastFrame));
    this.minFps = Math.min(this.minFps, fpsValue);
    this.maxFps = Math.max(this.maxFps, fpsValue);
    this.#drawPanelData(
      fps.data.data,
      Math.min(30, 30 - (fpsValue / 100) * 30),
      PerformanceStats.colorSchemes.fps
    );
    fps.text.current.textContent = `${fpsValue} FPS `;
    fps.text.range.textContent = ` (${this.minFps}-${this.maxFps})`;
    fps.ctx.putImageData(fps.data, 0, 0);

    this.lastFrame = this.now;
    this.framesThisSec = 0;
    if (this.#maxPanels !== 3) return;

    // Calculating size of memory used by the heap.
    const memValue = Math.round(performance.memory.usedJSHeapSize * 9.54e-7);
    this.minMem = Math.min(this.minMem, memValue);
    this.maxMem = Math.max(this.maxMem, memValue);
    this.#drawPanelData(
      mem.data.data,
      Math.min(30, 30 - memValue / 2),
      PerformanceStats.colorSchemes.mem
    );
    mem.text.current.textContent = `${memValue} MEM`;
    mem.text.range.textContent = ` (${this.minMem}-${this.maxMem})`;
    mem.ctx.putImageData(mem.data, 0, 0);
  }
}
