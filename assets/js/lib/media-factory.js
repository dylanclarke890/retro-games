class MediaFactory {
  constructor({ system, soundManager } = {}) {
    Guard.againstNull({ system });
    Guard.againstNull({ soundManager });
    this.system = system;
    this.soundManager = soundManager;
  }

  createFont({ name, path } = {}) {
    return new Font({ system: this.system, path, name });
  }

  createAnimationSheet({ path, size }) {
    return new GameAnimationSheet({ system: this.system, size, path });
  }

  createSound({ path, multiChannel = false }) {
    return new Sound({ path, multiChannel, soundManager: this.soundManager });
  }
}
