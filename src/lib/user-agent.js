export class UserAgent {
  device = {
    iPhone: false,
    iPhone4: false,
    iPad: false,
    android: false,
    winPhone: false,
    iOS: false,
    mobile: false,
    touchDevice: false,
  };
  noCache = false;
  pixelRatio = 1;
  screen = { w: 0, h: 0 };
  viewport = { w: 0, h: 0 };

  constructor(settings = {}) {
    Object.assign(this, settings);
  }

  static #cached = null;

  static get info() {
    if (!this.#cached) {
      const pixelRatio = window.devicePixelRatio || 1;
      const iPhone = /iPhone|iPod/i.test(navigator.userAgent);
      const iPad = /iPad/i.test(navigator.userAgent);
      const iOS = iPhone || iPad;
      const android = /android/i.test(navigator.userAgent);
      const winPhone = /Windows Phone/i.test(navigator.userAgent);

      this.#cached = new UserAgent({
        device: {
          iPhone,
          iPhone4: iPhone && pixelRatio === 2,
          iPad,
          android,
          winPhone,
          iOS,
          mobile: iOS || android || winPhone || /mobile/i.test(navigator.userAgent),
          touchDevice: "ontouchstart" in window || window.navigator.msMaxTouchPoints,
        },
        noCache: /\?nocache/.test(document.location.href),
        pixelRatio,
        screen: {
          x: window.screen.availWidth * pixelRatio,
          y: window.screen.availHeight * pixelRatio,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      });
    }

    return this.#cached;
  }
}
