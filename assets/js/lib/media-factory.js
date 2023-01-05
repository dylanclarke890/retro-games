class MediaFactory {
  constructor({ system, soundManager } = {}) {
    if (!system) throw new Error("System is required");
    if (!soundManager) throw new Error("Sound Manager is required");
    this.system = system;
    this.soundManager = soundManager;
  }

  createFont({ name, path } = {}) {
    return new Font({ system: this.system, path, name });
  }

  createAnimationSheet({ path, size }) {
    return new GameAnimationSheet({ system: this.system, size, path });
  }

  createSound({ path, multiChannel }) {
    return new Sound({ path, multiChannel, soundManager: this.soundManager });
  }
}
