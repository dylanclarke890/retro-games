class DebugPanel {
  active = false;
  container = null;
  label = "";
  name = "";
  options = [];
  panels = [];
  system = null;

  constructor({ name, label, system }) {
    Guard.againstNull({ system });
    this.system = system;
    this.name = name;
    this.label = label;
    this.container = $new("div");
    this.container.className = `debug-panel ${this.name}`;
  }

  toggle(active) {
    this.active = active;
    this.container.style.display = active ? "block" : "none";
  }

  addPanel(panel) {
    this.panels.push(panel);
    this.container.appendChild(panel.container);
  }

  addOption(option) {
    this.options.push(option);
    this.container.appendChild(option.container);
  }

  ready() {}
  beforeRun() {}
  afterRun() {}
}

class MapsDebugPanel extends DebugPanel {
  maps = [];
  mapScreens = [];

  constructor(opts) {
    super(opts);
    this.load();
  }

  load(game) {
    this.options = [];
    this.panels = [];

    if (!game || !game.backgroundMaps.length) {
      this.container.innerHTML = "<em>No Maps Loaded</em>";
      return;
    }

    console.debug("Debugger: Loading maps...");
    this.maps = game.backgroundMaps;
    this.mapScreens = [];
    this.container.innerHTML = "";

    for (let i = 0; i < this.maps.length; i++) {
      const map = this.maps[i];
      const subPanel = new DebugPanel({ name: i, label: `Layer ${i}`, system: this.system });
      const head = $new("strong");

      head.textContent = `${i}: ${map.tiles.path}`;
      subPanel.container.appendChild(head);
      subPanel.addOption(new DebugOption("Enabled", map, "enabled"));
      subPanel.addOption(new DebugOption("Pre Rendered", map, "preRender"));
      subPanel.addOption(new DebugOption("Show Chunks", map, "debugChunks"));

      this.generateMiniMap(subPanel, map, i, game.clearColor);
      this.addPanel(subPanel);
    }
  }

  generateMiniMap(panel, map, id, clearColor) {
    const scale = this.system.scale; // we'll need this a lot

    // resize the tileset, so that one tile is 'scale' pixels wide and high
    const tsC = $new("canvas");
    const tsCtx = tsC.getContext("2d");

    const w = map.tiles.width * scale;
    const h = map.tiles.height * scale;
    const ws = w / map.tilesize;
    const hs = h / map.tilesize;
    tsC.width = ws;
    tsC.height = hs;
    tsCtx.drawImage(map.tiles.data, 0, 0, w, h, 0, 0, ws, hs);

    // create the minimap canvas
    const mapCanvas = $new("canvas");
    mapCanvas.width = map.width * scale;
    mapCanvas.height = map.height * scale;
    const ctx = mapCanvas.getContext("2d");

    if (clearColor) {
      ctx.fillStyle = clearColor;
      ctx.fillRect(0, 0, w, h);
    }

    // draw the map
    let tile = 0;
    for (let x = 0; x < map.width; x++) {
      for (let y = 0; y < map.height; y++) {
        if ((tile = map.data[y][x])) {
          ctx.drawImage(
            tsC,
            Math.floor(((tile - 1) * scale) % ws),
            Math.floor(((tile - 1) * scale) / ws) * scale,
            scale,
            scale,
            x * scale,
            y * scale,
            scale,
            scale
          );
        }
      }
    }

    const mapContainer = $new("div");
    mapContainer.className = "debug-map-container";
    mapContainer.style.width = map.width * scale + "px";
    mapContainer.style.height = map.height * scale + "px";

    const mapScreen = $new("div");
    mapScreen.className = "debug-map-screen";
    mapScreen.style.width = (this.system.width / map.tilesize) * scale - 2 + "px";
    mapScreen.style.height = (this.system.height / map.tilesize) * scale - 2 + "px";
    this.mapScreens[id] = mapScreen;

    mapContainer.appendChild(mapCanvas);
    mapContainer.appendChild(mapScreen);
    panel.container.appendChild(mapContainer);
  }

  afterRun() {
    // Update the screen position DIV for each mini-map
    const scale = this.system.scale;
    for (let i = 0; i < this.maps.length; i++) {
      const map = this.maps[i];
      const screen = this.mapScreens[i];

      // Quick sanity check
      if (!map || !screen) continue;

      let x = map.scroll.x / map.tilesize;
      let y = map.scroll.y / map.tilesize;
      if (map.repeat) {
        x %= map.width;
        y %= map.height;
      }

      screen.style.left = x * scale + "px";
      screen.style.top = y * scale + "px";
    }
  }
}

class GraphDebugPanel extends DebugPanel {
  clocks = {};
  height = 128;
  marks = [];
  ms = 64;
  textY = 0;
  timeBeforeRun = 0;

  constructor(opts) {
    super(opts);
    this.mark16ms = (this.height - (this.height / this.ms) * 16).round();
    this.mark33ms = (this.height - (this.height / this.ms) * 33).round();
    this.msHeight = this.height / this.ms;

    this.graph = $new("canvas");
    this.graph.width = window.innerWidth;
    this.graph.height = this.height;
    this.container.appendChild(this.graph);
    this.ctx = this.graph.getContext("2d");

    this.ctx.fillStyle = "#444";
    this.ctx.fillRect(0, this.mark16ms, this.graph.width, 1);
    this.ctx.fillRect(0, this.mark33ms, this.graph.width, 1);

    this.addGraphMark("16ms", this.mark16ms);
    this.addGraphMark("33ms", this.mark33ms);

    this.addClock("draw", "Draw", "#13baff");
    this.addClock("update", "Entity Update", "#bb0fff");
    this.addClock("checks", "Entity Checks & Collisions", "#a2e908");
    this.addClock("lag", "System Lag", "#f26900");
  }

  addGraphMark(name, height) {
    const span = $new("span");
    span.className = "debug-graph-mark";
    span.textContent = name;
    span.style.top = height.round() + "px";
    this.container.appendChild(span);
  }

  addClock(name, description, color) {
    const mark = $new("span");
    mark.className = "debug-legend-color";
    mark.style.backgroundColor = color;

    const number = $new("span");
    number.className = "debug-legend-number";
    number.appendChild(document.createTextNode("0"));

    const legend = $new("span");
    legend.className = "debug-legend";
    legend.appendChild(mark);
    legend.appendChild(document.createTextNode(description + " ("));
    legend.appendChild(number);
    legend.appendChild(document.createTextNode("ms)"));

    this.container.appendChild(legend);

    this.clocks[name] = {
      description: description,
      color: color,
      current: 0,
      start: performance.now(),
      avg: 0,
      html: number,
    };
  }

  beginClock(name, offset) {
    this.clocks[name].start = performance.now() + (offset || 0);
  }

  endClock(name) {
    const clock = this.clocks[name];
    clock.current = Math.round(performance.now() - clock.start);
    clock.avg = clock.avg * 0.8 + clock.current * 0.2;
  }

  mark(msg, color) {
    if (this.active) this.marks.push({ msg: msg, color: color || "#fff" });
  }

  beforeRun() {
    this.endClock("lag");
    this.timeBeforeRun = performance.now();
  }

  afterRun() {
    const frameTime = performance.now() - this.timeBeforeRun;
    const nextFrameDue = 1000 / this.system.fps - frameTime;
    this.beginClock("lag", Math.max(nextFrameDue, 0));

    const x = this.graph.width - 1;
    const y = this.height;

    this.ctx.drawImage(this.graph, -1, 0);

    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(x, 0, 1, this.height);

    this.ctx.fillStyle = "#444";
    this.ctx.fillRect(x, this.mark16ms, 1, 1);

    this.ctx.fillStyle = "#444";
    this.ctx.fillRect(x, this.mark33ms, 1, 1);

    for (let ci in this.clocks) {
      const clock = this.clocks[ci];
      clock.html.textContent = clock.avg.toFixed(2);
      if (clock.color && clock.current > 0) {
        this.ctx.fillStyle = clock.color;
        const h = clock.current * this.msHeight;
        y -= h;
        this.ctx.fillRect(x, y, 1, h);
        clock.current = 0;
      }
    }

    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "top";
    this.ctx.globalAlpha = 0.5;

    for (let i = 0; i < this.marks.length; i++) {
      const m = this.marks[i];
      this.ctx.fillStyle = m.color;
      this.ctx.fillRect(x, 0, 1, this.height);
      if (m.msg) {
        this.ctx.fillText(m.msg, x - 1, this.textY);
        this.textY = (this.textY + 8) % 32;
      }
    }
    this.ctx.globalAlpha = 1;
    this.marks = [];
  }
}
