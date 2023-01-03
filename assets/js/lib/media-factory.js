class MediaFactory {
  constructor({ system } = {}) {
    if (!system) throw new Error("System is required");
    this.system = system;
  }

  createFont({ name, path } = {}) {
    return new Font({ system: this.system, path, name });
  }

  createAnimationSheet({ path, size }) {
    return new GameAnimationSheet({ system: this.system, size, path });
  }
}
