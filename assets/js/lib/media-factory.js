class MediaFactory {
  constructor({ system } = {}) {
    if (!system) throw new Error("System is required");
    this.system = system;
  }

  createFont(url) {
    return new Font({ system: this.system, path: url });
  }
}
