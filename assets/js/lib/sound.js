class SoundManager {
  clips = {};
  volume = 1;
  format = null;

  constructor() {
    VendorAttributes.normalise(window, "AudioContext");
    this.userAgent = UserAgent.info;

    // Quick sanity check if the Browser supports the Audio tag
    if (!Sound.enabled || !window.Audio) {
      Sound.enabled = false;
      return;
    }

    // Probe sound formats and determine the file extension to load
    const probe = new Audio();
    for (let i = 0; i < Sound.use.length; i++) {
      const format = Sound.use[i];
      if (!probe.canPlayType(format.mime)) continue;
      this.format = format;
      break;
    }

    // No compatible format found? -> Disable sound
    if (!this.format) Sound.enabled = false;

    // Create WebAudio Context
    if (Sound.enabled && Sound.useWebAudio) {
      // TODO
      this.audioContext = new AudioContext();
      ig.system.canvas.addEventListener("touchstart", () => this.unlockWebAudio(), false);
      ig.system.canvas.addEventListener("mousedown", () => this.unlockWebAudio(), false);
    }
  }

  unlockWebAudio() {
    ig.system.canvas.removeEventListener("touchstart", () => this.unlockWebAudio(), false); // TODO
    ig.system.canvas.removeEventListener("mousedown", () => this.unlockWebAudio(), false);

    const buffer = this.audioContext.createBuffer(1, 1, 22050); // create empty buffer
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  }

  load(path, multiChannel, loadCallback) {
    return multiChannel && Sound.useWebAudio
      ? this.loadWebAudio(path, multiChannel, loadCallback) // Requested as MultiChannel and we're using WebAudio.
      : this.loadHTML5Audio(path, multiChannel, loadCallback); // old-school HTML5 Audio - always used for Music.
  }

  loadWebAudio(path, _multiChannel, loadCallback) {
    if (this.clips[path]) return this.clips[path];

    // Path to the soundfile with the right extension (.ogg or .mp3)
    const realPath = ig.prefix + path.replace(/[^\.]+$/, this.format.ext) + ig.nocache; // TODO
    const audioSource = new WebAudioSource();
    this.clips[path] = audioSource;

    const request = new XMLHttpRequest();
    request.open("GET", realPath, true);
    request.responseType = "arraybuffer";

    request.onload = (event) => {
      this.audioContext.decodeAudioData(
        request.response,
        (buffer) => {
          audioSource.buffer = buffer;
          if (loadCallback) loadCallback(path, true, event);
        },
        (event) => {
          if (loadCallback) loadCallback(path, false, event);
        }
      );
    };
    request.onerror = (ev) => {
      if (loadCallback) loadCallback(path, false, ev);
    };
    request.send();

    return audioSource;
  }

  loadHTML5Audio(path, multiChannel, loadCallback) {
    // Sound file already loaded?
    if (this.clips[path]) {
      // Loaded as WebAudio, but now requested as HTML5 Audio? Probably Music?
      if (this.clips[path] instanceof WebAudioSource) return this.clips[path];

      // Only loaded as single channel and now requested as multichannel?
      if (multiChannel && this.clips[path].length < Sound.channels) {
        // Path to the soundfile with the right extension (.ogg or .mp3)
        const realPath = ig.prefix + path.replace(/[^\.]+$/, this.format.ext) + ig.nocache; // TODO
        for (let i = this.clips[path].length; i < Sound.channels; i++) {
          const a = new Audio(realPath);
          a.load();
          this.clips[path].push(a);
        }
      }
      return this.clips[path][0];
    }

    const clip = new Audio(realPath);
    if (loadCallback) {
      // The canplaythrough event is dispatched when the browser determines
      // that the sound can be played without interuption, provided the
      // download rate doesn't change.
      // Mobile browsers stubbornly refuse to preload HTML5, so we simply
      // ignore the canplaythrough event and immediately "fake" a successful
      // load callback
      if (this.userAgent.device.mobile) setTimeout(() => loadCallback(path, true, null), 0);
      else {
        clip.addEventListener(
          "canplaythrough",
          function cb(ev) {
            clip.removeEventListener("canplaythrough", cb, false);
            loadCallback(path, true, ev);
          },
          false
        );
        clip.addEventListener("error", (ev) => loadCallback(path, false, ev), false);
      }
    }
    clip.preload = "auto";
    clip.load();

    this.clips[path] = [clip];
    if (multiChannel)
      for (let i = 1; i < Sound.channels; i++) {
        const a = new Audio(realPath);
        a.load();
        this.clips[path].push(a);
      }

    return clip;
  }

  get(path) {
    // Find and return a channel that is not currently playing
    const channels = this.clips[path];
    // Is this a WebAudio source? We only ever have one for each Sound
    if (channels && channels instanceof WebAudioSource) return channels;
    // Oldschool HTML5 Audio - find a channel that's not currently
    // playing or, if all are playing, rewind one
    for (let i = 0, clip; (clip = channels[i++]); ) {
      if (!clip.paused && !clip.ended) continue;
      if (clip.ended) clip.currentTime = 0;
      return clip;
    }

    // No free channels, pause and rewind the first.
    const firstChannel = channels[0];
    firstChannel.pause();
    firstChannel.currentTime = 0;
    return firstChannel;
  }
}

class Music {
  tracks = [];
  namedTracks = {};
  currentTrack = null;
  currentIndex = 0;
  random = false;

  #volume = 1;
  #loop = false;
  #fadeInterval = 0;
  #fadeTimer = null;
  _endedCallbackBound = null;

  constructor() {
    this._endedCallbackBound = this.#endedCallback.bind(this);

    Object.defineProperty(this, "volume", {
      get: this.getVolume.bind(this),
      set: this.setVolume.bind(this),
    });

    Object.defineProperty(this, "loop", {
      get: this.getLooping.bind(this),
      set: this.setLooping.bind(this),
    });
  }

  add(music, name) {
    if (!Sound.enabled) return;
    const path = music instanceof Sound ? music.path : music;
    const track = ig.soundManager.load(path, false); // TODO

    // Did we get a WebAudio Source? This is suboptimal; Music should be loaded
    // as HTML5 Audio so it can be streamed
    if (track instanceof WebAudioSource) {
      // Since this error will likely occur at game start, we stop the game
      // to not produce any more errors.
      throw new Error(
        `Sound '${path}' loaded as MultiChannel but used for music. Set the multiChannel param to false when loading.`
      );
    }

    track.loop = this.#loop;
    track.volume = this.#volume;
    track.addEventListener("ended", this._endedCallbackBound, false); // TODO
    this.tracks.push(track);

    if (name) this.namedTracks[name] = track;
    if (!this.currentTrack) this.currentTrack = track;
  }

  next() {
    if (!this.tracks.length) return;
    this.stop();
    this.currentIndex = this.random
      ? Math.floor(Math.random() * this.tracks.length)
      : (this.currentIndex + 1) % this.tracks.length;
    this.currentTrack = this.tracks[this.currentIndex];
    this.play();
  }

  pause() {
    if (!this.currentTrack) return;
    this.currentTrack.pause();
  }

  stop() {
    if (!this.currentTrack) return;
    this.currentTrack.pause();
    this.currentTrack.currentTime = 0;
  }

  play(name) {
    // If a name was provided, stop playing the current track (if any)
    // and play the named track
    if (name && this.namedTracks[name]) {
      const newTrack = this.namedTracks[name];
      if (newTrack !== this.currentTrack) {
        this.stop();
        this.currentTrack = newTrack;
      }
    } else if (!this.currentTrack) return;
    this.currentTrack.play();
  }

  getLooping() {
    return this.#loop;
  }

  setLooping(l) {
    this.#loop = l;
    for (let i in this.tracks) this.tracks[i].loop = l;
  }

  getVolume() {
    return this.#volume;
  }

  setVolume(v) {
    this.#volume = v.constrain(0, 1);
    for (let i in this.tracks) this.tracks[i].volume = this.#volume;
  }

  fadeOut(time) {
    if (!this.currentTrack) return;
    clearInterval(this.#fadeInterval);
    this.#fadeTimer = new Timer(time);
    this.#fadeInterval = setInterval(this.#fadeStep.bind(this), 50); // TODO
  }

  #fadeStep() {
    const v =
      this.#fadeTimer.delta().map(-this.#fadeTimer.target, 0, 1, 0).limit(0, 1) * this.#volume;

    if (v <= 0.01) {
      this.stop();
      this.currentTrack.volume = this.#volume;
      clearInterval(this.#fadeInterval);
    } else this.currentTrack.volume = v;
  }

  #endedCallback() {
    if (this.#loop) this.play();
    else this.next();
  }
}

class Sound {
  static FORMAT = {
    MP3: { ext: "mp3", mime: "audio/mpeg" },
    M4A: { ext: "m4a", mime: "audio/mp4; codecs=mp4a.40.2" },
    OGG: { ext: "ogg", mime: "audio/ogg; codecs=vorbis" },
    WEBM: { ext: "webm", mime: "audio/webm; codecs=vorbis" },
    CAF: { ext: "caf", mime: "audio/x-caf" },
  };
  static enabled = true;
  static use = [Sound.FORMAT.OGG, Sound.FORMAT.MP3];
  static useWebAudio = !!window.AudioContext;
  static channels = 4;

  path = "";
  volume = 1;
  currentClip = null;
  multiChannel = true;
  #loop = false;

  constructor(path, multiChannel) {
    this.path = path;
    this.multiChannel = multiChannel !== false;

    Object.defineProperty(this, "loop", {
      get: this.getLooping.bind(this),
      set: this.setLooping.bind(this),
    });

    this.load();
  }

  getLooping() {
    return this.#loop;
  }

  setLooping(loop) {
    this.#loop = loop;
    if (this.currentClip) this.currentClip.loop = loop;
  }

  load(loadCallback) {
    if (!Sound.enabled) {
      if (loadCallback) loadCallback(this.path, true);
      return;
    }

    if (ig.ready)
      // TODO
      ig.soundManager.load(this.path, this.multiChannel, loadCallback); // TODO
    else ig.addResource(this); // TODO
  }

  play() {
    if (!Sound.enabled) return;

    this.currentClip = ig.soundManager.get(this.path); // TODO
    this.currentClip.loop = this._loop;
    this.currentClip.volume = ig.soundManager.volume * this.volume;
    this.currentClip.play();
  }

  stop() {
    if (this.currentClip) {
      this.currentClip.pause();
      this.currentClip.currentTime = 0;
    }
  }
}

class WebAudioSource {
  sources = [];
  gain = null;
  buffer = null;
  _loop = false;

  constructor() {
    this.gain = ig.soundManager.audioContext.createGain(); // TODO
    this.gain.connect(ig.soundManager.audioContext.destination);

    Object.defineProperty(this, "loop", {
      get: this.getLooping.bind(this),
      set: this.setLooping.bind(this),
    });

    Object.defineProperty(this, "volume", {
      get: this.getVolume.bind(this),
      set: this.setVolume.bind(this),
    });
  }

  play() {
    if (!this.buffer) return;

    const source = ig.soundManager.audioContext.createBufferSource(); // TODO
    source.buffer = this.buffer;
    source.connect(this.gain);
    source.loop = this._loop;

    // Add this new source to our sources array and remove it again
    // later when it has finished playing.
    this.sources.push(source);
    source.onended = () => this.sources.erase(source);

    source.start(0);
  }

  pause() {
    for (let i = 0; i < this.sources.length; i++) {
      try {
        this.sources[i].stop();
      } catch (err) {}
    }
  }

  getLooping() {
    return this._loop;
  }

  setLooping(loop) {
    this._loop = loop;

    for (let i = 0; i < this.sources.length; i++) this.sources[i].loop = loop;
  }

  getVolume() {
    return this.gain.gain.value;
  }

  setVolume(volume) {
    this.gain.gain.value = volume;
  }
}
