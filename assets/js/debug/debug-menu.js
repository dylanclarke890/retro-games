const panels = [
  {
    type: DebugPanel,
    name: "entities",
    label: "Entities",
    options: [
      { name: "Checks & Collisions", object: Entity, property: "_debugEnableChecks" },
      { name: "Show Collision Boxes", object: Entity, property: "_debugShowBoxes" },
      { name: "Show Velocities", object: Entity, property: "_debugShowVelocities" },
      { name: "Show Names & Targets", object: Entity, property: "_debugShowNames" },
    ],
  },
  {
    type: GraphDebugPanel,
    name: "graph",
    label: "Performance",
  },
  {
    type: MapsDebugPanel,
    name: "maps",
    label: "Background Maps",
  },
];

class Debug {
  options = {};
  panels = {};
  numbers = {};
  container = null;
  panelMenu = null;
  numberContainer = null;
  activePanel = null;

  debugTime = 0;
  debugTickAvg = 0.016;
  debugRealTime = performance.now();

  constructor() {
    this.#injectDebugMethods();
    this.#injectStylesheet();
    this.#createContainers();
    // Set ig.log(), ig.assert() and ig.show()
    if (window.console && window.console.log && window.console.assert) {
      // Can't use .bind() on native functions in IE9 :/
      ig.log = console.log.bind ? console.log.bind(console) : console.log;
      ig.assert = console.assert.bind ? console.assert.bind(console) : console.assert;
    }
    ig.show = this.showNumber.bind(this);
  }

  #injectDebugMethods() {
    ig.System.inject({
      // TODO
      run: function () {
        ig.debug.beforeRun();
        this.parent();
        ig.debug.afterRun();
      },

      setGameNow: function (gameClass) {
        this.parent(gameClass);
        ig.debug.ready();
      },
    });

    ig.Game.inject({
      loadLevel: function (data) {
        this.parent(data);
        ig.debug.panels.maps.load(this);
      },
    });

    ig.Game.inject({
      draw: function () {
        ig.graph.beginClock("draw");
        this.parent();
        ig.graph.endClock("draw");
      },

      update: function () {
        ig.graph.beginClock("update");
        this.parent();
        ig.graph.endClock("update");
      },

      checkEntities: function () {
        ig.graph.beginClock("checks");
        this.parent();
        ig.graph.endClock("checks");
      },
    });

    Entity.inject({
      colors: {
        names: "#fff",
        velocities: "#0f0",
        boxes: "#f00",
      },

      draw: function () {
        this.parent();

        const { ctx, drawPosition, scale } = this.system; // TODO
        // Collision Boxes
        if (Entity._debugShowBoxes) {
          ctx.strokeStyle = this.colors.boxes;
          ctx.lineWidth = 1.0;
          ctx.strokeRect(
            drawPosition(this.pos.x.round() - ig.game.screen.x) - 0.5,
            drawPosition(this.pos.y.round() - ig.game.screen.y) - 0.5,
            this.size.x * scale,
            this.size.y * scale
          );
        }

        // Velocities
        if (Entity._debugShowVelocities) {
          const x = this.pos.x + this.size.x / 2;
          const y = this.pos.y + this.size.y / 2;
          this._debugDrawLine(this.colors.velocities, x, y, x + this.vel.x, y + this.vel.y);
        }

        // Names & Targets
        if (Entity._debugShowNames) {
          if (this.name) {
            ctx.fillStyle = this.colors.names;
            ctx.fillText(
              this.name,
              drawPosition(this.pos.x - ig.game.screen.x),
              drawPosition(this.pos.y - ig.game.screen.y)
            );
          }

          if (typeof this.target === "object") {
            for (let t in this.target) {
              const ent = ig.game.getEntityByName(this.target[t]);
              if (!ent) continue;
              this._debugDrawLine(
                this.colors.names,
                this.pos.x + this.size.x / 2,
                this.pos.y + this.size.y / 2,
                ent.pos.x + ent.size.x / 2,
                ent.pos.y + ent.size.y / 2
              );
            }
          }
        }
      },

      _debugDrawLine: function (color, sx, sy, dx, dy) {
        const { ctx, drawPosition } = this.system;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(drawPosition(sx - ig.game.screen.x), drawPosition(sy - ig.game.screen.y));
        ctx.lineTo(drawPosition(dx - ig.game.screen.x), drawPosition(dy - ig.game.screen.y));
        ctx.stroke();
        ctx.closePath();
      },
    });

    ig.Entity._debugEnableChecks = true;
    ig.Entity._debugShowBoxes = false;
    ig.Entity._debugShowVelocities = false;
    ig.Entity._debugShowNames = false;

    ig.Entity.oldCheckPair = ig.Entity.checkPair;
    ig.Entity.checkPair = function (a, b) {
      if (!ig.Entity._debugEnableChecks) return;
      ig.Entity.oldCheckPair(a, b);
    };
  }

  #injectStylesheet() {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = "lib/impact/debug/debug.css"; // TODO
    document.body.appendChild(style);
  }

  #createContainers() {
    // Create the Debug Container
    this.container = document.createElement("div");
    this.container.className = "ig_debug";
    document.body.appendChild(this.container);

    // Create and add the Menu Container
    this.panelMenu = document.createElement("div");
    this.panelMenu.innerHTML = '<div class="debug-head">Debug:</div>';
    this.panelMenu.className = "debug-panel-menu";

    this.container.appendChild(this.panelMenu);

    // Create and add the Stats Container
    this.numberContainer = document.createElement("div");
    this.numberContainer.className = "debug-stats";
    this.panelMenu.appendChild(this.numberContainer);
  }

  addPanel(panelDef) {
    // Create the panel and options
    const panel = new panelDef.type(panelDef.name, panelDef.label);
    if (panelDef.options) {
      for (let i = 0; i < panelDef.options.length; i++) {
        const { name, object, property } = panelDef.options[i];
        panel.addOption(new DebugOption(name, object, property));
      }
    }

    this.panels[panel.name] = panel;
    panel.container.style.display = "none";
    this.container.appendChild(panel.container);

    // Create the menu item
    const menuItem = document.createElement("div");
    menuItem.className = "debug-menu-item";
    menuItem.textContent = panel.label;
    menuItem.addEventListener("click", () => this.togglePanel(panel), false);
    panel.menuItem = menuItem;

    // Insert menu item in alphabetical order into the menu
    let inserted = false;
    for (let i = 1; i < this.panelMenu.childNodes.length; i++) {
      const child = this.panelMenu.childNodes[i];
      if (child.textContent > panel.label) {
        this.panelMenu.insertBefore(menuItem, child);
        inserted = true;
        break;
      }
    }
    // Not inserted? Append at the end!
    if (!inserted) this.panelMenu.appendChild(menuItem);
  }

  togglePanel(panel) {
    if (this.activePanel && this.activePanel !== panel) {
      this.activePanel.toggle(false);
      this.activePanel.menuItem.className = "debug-menu-item";
      this.activePanel = null;
    }
    const display = panel.container.style.display;
    const active = display !== "block";
    panel.toggle(active);
    panel.menuItem.className = "debug-menu-item" + (active ? " active" : "");
    if (active) this.activePanel = panel;
  }

  showPanel(name) {
    this.togglePanel(this.panels[name]);
  }

  addNumber(name) {
    const numberSpan = document.createElement("span");
    this.numberContainer.appendChild(numberSpan);
    this.numberContainer.appendChild(document.createTextNode(name));
    this.numbers[name] = numberSpan;
  }

  showNumber(name, number) {
    if (!this.numbers[name]) this.addNumber(name);
    this.numbers[name].textContent = number;
  }

  ready() {
    for (let panel in this.panels) this.panels[panel].ready();
  }

  beforeRun() {
    const timeBeforeRun = performance.now();
    this.debugTickAvg = this.debugTickAvg * 0.8 + (timeBeforeRun - this.debugRealTime) * 0.2;
    this.debugRealTime = timeBeforeRun;
    if (this.activePanel) this.activePanel.beforeRun();
  }

  afterRun() {
    const frameTime = performance.now() - this.debugRealTime;
    this.debugTime = this.debugTime * 0.8 + frameTime * 0.2;
    if (this.activePanel) this.activePanel.afterRun();
    this.showNumber("ms", this.debugTime.toFixed(2));
    this.showNumber("fps", Math.round(1000 / this.debugTickAvg));
    this.showNumber("draws", ig.Image.drawCount);
    if (ig.game && ig.game.entities) this.showNumber("entities", ig.game.entities.length); // TODO
    ig.Image.drawCount = 0;
  }
}

class DebugOption {
  name = "";
  labelName = "";
  className = "debug-option";
  label = null;
  mark = null;
  container = null;
  active = false;

  colors = {
    enabled: "#fff",
    disabled: "#444",
  };

  constructor(name, object, property) {
    this.name = name;
    this.object = object;
    this.property = property;
    this.active = this.object[this.property];

    this.container = document.createElement("div");
    this.container.className = "debug-option";
    this.label = document.createElement("span");
    this.label.className = "debug-label";
    this.label.textContent = this.name;
    this.mark = document.createElement("span");
    this.mark.className = "debug-label-mark";

    this.container.appendChild(this.mark);
    this.container.appendChild(this.label);
    this.container.addEventListener("click", (ev) => this.click(ev), false);
    this.setLabel();
  }

  setLabel() {
    this.mark.style.backgroundColor = this.active ? this.colors.enabled : this.colors.disabled;
  }

  click(event) {
    this.active = !this.active;
    this.object[this.property] = this.active;
    this.setLabel();
    event.stopPropagation();
    event.preventDefault();
    return false;
  }
}
