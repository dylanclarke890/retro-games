class SoundManager {
  clips = {};
  volume = 1;
  format = null;

  constructor() {
    // Quick sanity check if the Browser supports the Audio tag
    if (Sound.enabled || !window.Audio) {
      Sound.enabled = false; // TODO
      return;
    }

    // Probe sound formats and determine the file extension to load
    const probe = new Audio();
    for (let i = 0; i < ig.Sound.use.length; i++) {
      const format = ig.Sound.use[i]; // TODO
      if (!probe.canPlayType(format.mime)) continue;
      this.format = format;
      break;
    }

    // No compatible format found? -> Disable sound
    if (!this.format) ig.Sound.enabled = false; // TODO

    // Create WebAudio Context
    if (Sound.enabled && ig.Sound.useWebAudio) {
      // TODO
      this.audioContext = new AudioContext();
      this.boundWebAudioUnlock = this.unlockWebAudio.bind(this);
      ig.system.canvas.addEventListener("touchstart", this.boundWebAudioUnlock, false);
      ig.system.canvas.addEventListener("mousedown", this.boundWebAudioUnlock, false);
    }
  }

  unlockWebAudio() {
    ig.system.canvas.removeEventListener("touchstart", this.boundWebAudioUnlock, false); // TODO
    ig.system.canvas.removeEventListener("mousedown", this.boundWebAudioUnlock, false);

    // create empty buffer
    const buffer = this.audioContext.createBuffer(1, 1, 22050);
    const source = this.audioContext.createBufferSource(); // TODO
    source.buffer = buffer;

    source.connect(this.audioContext.destination);
    source.start(0);
  }

  load(path, multiChannel, loadCallback) {
    return multiChannel && ig.Sound.useWebAudio
      ? // Requested as Multichannel and we're using WebAudio?
        this.loadWebAudio(path, multiChannel, loadCallback)
      : // Oldschool HTML5 Audio - always used for Music
        this.loadHTML5Audio(path, multiChannel, loadCallback);
  }

  loadWebAudio(path, multiChannel, loadCallback) {
    // Path to the soundfile with the right extension (.ogg or .mp3)
    const realPath = ig.prefix + path.replace(/[^\.]+$/, this.format.ext) + ig.nocache;

    if (this.clips[path]) return this.clips[path];

    const audioSource = new ig.Sound.WebAudioSource();
    this.clips[path] = audioSource;

    const request = new XMLHttpRequest();
    request.open("GET", realPath, true);
    request.responseType = "arraybuffer";

    request.onload = (ev) => {
      this.audioContext.decodeAudioData(
        request.response,
        function (buffer) {
          audioSource.buffer = buffer;
          if (loadCallback) loadCallback(path, true, ev);
        },
        (ev) => {
          if (loadCallback) loadCallback(path, false, ev);
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
    // Path to the soundfile with the right extension (.ogg or .mp3)
    const realPath = ig.prefix + path.replace(/[^\.]+$/, this.format.ext) + ig.nocache;

    // Sound file already loaded?
    if (this.clips[path]) {
      // Loaded as WebAudio, but now requested as HTML5 Audio? Probably Music?
      if (this.clips[path] instanceof ig.Sound.WebAudioSource) {
        return this.clips[path];
      }

      // Only loaded as single channel and now requested as multichannel?
      if (multiChannel && this.clips[path].length < ig.Sound.channels) {
        for (var i = this.clips[path].length; i < ig.Sound.channels; i++) {
          var a = new Audio(realPath);
          a.load();
          this.clips[path].push(a);
        }
      }
      return this.clips[path][0];
    }

    var clip = new Audio(realPath);
    if (loadCallback) {
      // The canplaythrough event is dispatched when the browser determines
      // that the sound can be played without interuption, provided the
      // download rate doesn't change.
      // Mobile browsers stubbornly refuse to preload HTML5, so we simply
      // ignore the canplaythrough event and immediately "fake" a successful
      // load callback
      if (ig.ua.mobile) {
        setTimeout(function () {
          loadCallback(path, true, null);
        }, 0);
      } else {
        clip.addEventListener(
          "canplaythrough",
          function cb(ev) {
            clip.removeEventListener("canplaythrough", cb, false);
            loadCallback(path, true, ev);
          },
          false
        );

        clip.addEventListener(
          "error",
          function (ev) {
            loadCallback(path, false, ev);
          },
          false
        );
      }
    }
    clip.preload = "auto";
    clip.load();

    this.clips[path] = [clip];
    if (multiChannel) {
      for (var i = 1; i < ig.Sound.channels; i++) {
        var a = new Audio(realPath);
        a.load();
        this.clips[path].push(a);
      }
    }
    return clip;
  }

  get(path) {
    // Find and return a channel that is not currently playing
    const channels = this.clips[path];
    // Is this a WebAudio source? We only ever have one for each Sound
    if (channels && channels instanceof ig.Sound.WebAudioSource) return channels; // TODO
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

ig.Music = ig.Class.extend({
  tracks: [],
  namedTracks: {},
  currentTrack: null,
  currentIndex: 0,
  random: false,

  _volume: 1,
  _loop: false,
  _fadeInterval: 0,
  _fadeTimer: null,
  _endedCallbackBound: null,

  init: function () {
    this._endedCallbackBound = this._endedCallback.bind(this);

    Object.defineProperty(this, "volume", {
      get: this.getVolume.bind(this),
      set: this.setVolume.bind(this),
    });

    Object.defineProperty(this, "loop", {
      get: this.getLooping.bind(this),
      set: this.setLooping.bind(this),
    });
  },

  add: function (music, name) {
    if (!ig.Sound.enabled) {
      return;
    }

    var path = music instanceof ig.Sound ? music.path : music;

    var track = ig.soundManager.load(path, false);

    // Did we get a WebAudio Source? This is suboptimal; Music should be loaded
    // as HTML5 Audio so it can be streamed
    if (track instanceof ig.Sound.WebAudioSource) {
      // Since this error will likely occur at game start, we stop the game
      // to not produce any more errors.
      ig.system.stopRunLoop();
      throw (
        "Sound '" +
        path +
        "' loaded as Multichannel but used for Music. " +
        "Set the multiChannel param to false when loading, e.g.: new ig.Sound(path, false)"
      );
    }

    track.loop = this._loop;
    track.volume = this._volume;
    track.addEventListener("ended", this._endedCallbackBound, false);
    this.tracks.push(track);

    if (name) {
      this.namedTracks[name] = track;
    }

    if (!this.currentTrack) {
      this.currentTrack = track;
    }
  },

  next: function () {
    if (!this.tracks.length) {
      return;
    }

    this.stop();
    this.currentIndex = this.random
      ? Math.floor(Math.random() * this.tracks.length)
      : (this.currentIndex + 1) % this.tracks.length;
    this.currentTrack = this.tracks[this.currentIndex];
    this.play();
  },

  pause: function () {
    if (!this.currentTrack) {
      return;
    }
    this.currentTrack.pause();
  },

  stop: function () {
    if (!this.currentTrack) {
      return;
    }
    this.currentTrack.pause();
    this.currentTrack.currentTime = 0;
  },

  play: function (name) {
    // If a name was provided, stop playing the current track (if any)
    // and play the named track
    if (name && this.namedTracks[name]) {
      var newTrack = this.namedTracks[name];
      if (newTrack != this.currentTrack) {
        this.stop();
        this.currentTrack = newTrack;
      }
    } else if (!this.currentTrack) {
      return;
    }
    this.currentTrack.play();
  },

  getLooping: function () {
    return this._loop;
  },

  setLooping: function (l) {
    this._loop = l;
    for (var i in this.tracks) {
      this.tracks[i].loop = l;
    }
  },

  getVolume: function () {
    return this._volume;
  },

  setVolume: function (v) {
    this._volume = v.limit(0, 1);
    for (var i in this.tracks) {
      this.tracks[i].volume = this._volume;
    }
  },

  fadeOut: function (time) {
    if (!this.currentTrack) {
      return;
    }

    clearInterval(this._fadeInterval);
    this._fadeTimer = new ig.Timer(time);
    this._fadeInterval = setInterval(this._fadeStep.bind(this), 50);
  },

  _fadeStep: function () {
    var v =
      this._fadeTimer.delta().map(-this._fadeTimer.target, 0, 1, 0).limit(0, 1) * this._volume;

    if (v <= 0.01) {
      this.stop();
      this.currentTrack.volume = this._volume;
      clearInterval(this._fadeInterval);
    } else {
      this.currentTrack.volume = v;
    }
  },

  _endedCallback: function () {
    if (this._loop) {
      this.play();
    } else {
      this.next();
    }
  },
});

class Sound {
  static enabled = true;
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

ig.Sound.WebAudioSource = ig.Class.extend({
  sources: [],
  gain: null,
  buffer: null,
  _loop: false,

  init: function () {
    this.gain = ig.soundManager.audioContext.createGain();
    this.gain.connect(ig.soundManager.audioContext.destination);

    Object.defineProperty(this, "loop", {
      get: this.getLooping.bind(this),
      set: this.setLooping.bind(this),
    });

    Object.defineProperty(this, "volume", {
      get: this.getVolume.bind(this),
      set: this.setVolume.bind(this),
    });
  },

  play: function () {
    if (!this.buffer) {
      return;
    }
    var source = ig.soundManager.audioContext.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.gain);
    source.loop = this._loop;

    // Add this new source to our sources array and remove it again
    // later when it has finished playing.
    var that = this;
    this.sources.push(source);
    source.onended = function () {
      that.sources.erase(source);
    };

    source.start(0);
  },

  pause: function () {
    for (var i = 0; i < this.sources.length; i++) {
      try {
        this.sources[i].stop();
      } catch (err) {}
    }
  },

  getLooping: function () {
    return this._loop;
  },

  setLooping: function (loop) {
    this._loop = loop;

    for (var i = 0; i < this.sources.length; i++) {
      this.sources[i].loop = loop;
    }
  },

  getVolume: function () {
    return this.gain.gain.value;
  },

  setVolume: function (volume) {
    this.gain.gain.value = volume;
  },
});

ig.Sound.FORMAT = {
  MP3: { ext: "mp3", mime: "audio/mpeg" },
  M4A: { ext: "m4a", mime: "audio/mp4; codecs=mp4a.40.2" },
  OGG: { ext: "ogg", mime: "audio/ogg; codecs=vorbis" },
  WEBM: { ext: "webm", mime: "audio/webm; codecs=vorbis" },
  CAF: { ext: "caf", mime: "audio/x-caf" },
};
ig.Sound.use = [ig.Sound.FORMAT.OGG, ig.Sound.FORMAT.MP3];
ig.Sound.channels = 4;
ig.normalizeVendorAttribute(window, "AudioContext");
ig.Sound.useWebAudio = !!window.AudioContext;
