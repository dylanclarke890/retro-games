/**
 * @returns {HTMLElement}
 */
export function $el(selector) {
  if (selector instanceof HTMLElement) return selector;
  return document.querySelector(selector);
}

/**
 * @returns {HTMLElement}
 */
export function $new(tagname, opts = null) {
  return document.createElement(tagname, opts);
}

export function getInnerHeight(element) {
  const computed = getComputedStyle(element),
    padding = parseInt(computed.paddingTop) + parseInt(computed.paddingBottom);
  return element.clientHeight - padding;
}

export function getInnerWidth(element) {
  const computed = getComputedStyle(element),
    padding = parseInt(computed.paddingLeft) + parseInt(computed.paddingRight);
  return element.clientWidth - padding;
}

export function loadScript({ src, isES6Module, cb = () => {} } = {}) {
  if (isES6Module !== false) isES6Module = true;
  const script = document.createElement("script");
  script.type = isES6Module ? "module" : "text/javascript";
  script.addEventListener("load", (e) => cb(e, src));
  script.src = src;
  document.body.appendChild(script);
}

export function screenshotCanvas(canvas) {
  const image = new Image();
  image.src = canvas.toDataURL();
  document.body.appendChild(image);
}
