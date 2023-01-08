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

class DebugPanel {
  active = false;
  container = null;
  options = [];
  panels = [];
  label = "";
  name = "";

  constructor(name, label) {
    this.name = name;
    this.label = label;
    this.container = document.createElement("div");
    this.container.className = "ig-debug-panel " + this.name;
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
