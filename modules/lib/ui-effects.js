//#region slide

import { $el } from "./dom-utils.js";

export function slideUp(target, easing = "ease-in", duration = 500, cb = () => {}) {
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.transitionTimingFunction = easing;
  target.style.boxSizing = "border-box";
  target.style.height = target.offsetHeight + "px";
  target.offsetHeight;
  target.style.overflow = "hidden";
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  window.setTimeout(() => {
    target.style.display = "none";
    target.style.removeProperty("height");
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    target.style.removeProperty("overflow");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
    if (cb) cb(target);
  }, duration);
}

export function slideDown(target, easing = "ease-in", duration = 500, cb = () => {}) {
  target.style.removeProperty("display");
  let display = window.getComputedStyle(target).display;
  if (display === "none") display = "block";
  target.style.display = display;

  const height = target.offsetHeight;
  target.style.overflow = "hidden";
  target.style.height = 0;
  target.style.paddingTop = 0;
  target.style.paddingBottom = 0;
  target.style.marginTop = 0;
  target.style.marginBottom = 0;
  target.offsetHeight; // Trigger repaint of DOM.

  target.style.boxSizing = "border-box";
  target.style.transitionProperty = "height, margin, padding";
  target.style.transitionDuration = duration + "ms";
  target.style.transitionTimingFunction = easing;
  target.style.height = height + "px";
  target.style.removeProperty("padding-top");
  target.style.removeProperty("padding-bottom");
  target.style.removeProperty("margin-top");
  target.style.removeProperty("margin-bottom");
  window.setTimeout(() => {
    target.style.removeProperty("height");
    target.style.removeProperty("overflow");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
    target.style.removeProperty("transition-timing-function");
    if (cb) cb(target);
  }, duration);
}

export function slideToggle(target, easing = "ease-in", duration = 500, cb = () => {}) {
  if (window.getComputedStyle(target).display === "block") slideUp(target, easing, duration, cb);
  else slideDown(target, easing, duration, cb);
}
//#endregion slide

//#region fade

// TODO: flickering effects - probs best to split this back out.
export function fade(target, { isFadeIn, easing, duration, cb } = {}) {
  isFadeIn = isFadeIn || false;
  easing = easing || "ease-in";
  duration = duration || 500;
  cb = cb || (() => {});

  target.style.removeProperty("display");
  let display = window.getComputedStyle(target).display;
  if (display === "none" && !isFadeIn) display = "block";
  target.style.display = display;
  target.style.opacity = isFadeIn ? 0 : 1;
  target.offsetHeight; // Trigger repaint of DOM.

  target.style.boxSizing = "border-box";
  target.style.transitionProperty = "opacity";
  target.style.transitionDuration = duration + "ms";
  target.style.transitionTimingFunction = easing;
  target.style.opacity = isFadeIn ? 1 : 0;
  window.setTimeout(() => {
    target.style.removeProperty("opacity");
    target.style.removeProperty("transition-duration");
    target.style.removeProperty("transition-property");
    target.style.removeProperty("transition-timing-function");
    target.style.removeProperty("display");
    let display = window.getComputedStyle(target).display;
    if (display === (isFadeIn ? "none" : "block")) display = isFadeIn ? "block" : "none";
    target.style.display = display;
    if (cb) cb(target);
  }, duration);
}

export function fadeIn(target, { easing, duration, cb } = {}) {
  fade(target, { isFadeIn: true, easing, duration, cb });
}

export function fadeOut(target, { easing, duration, cb } = {}) {
  fade(target, { isFadeIn: false, easing, duration, cb });
}

export function fadeToggle(target, { easing, duration = 500, cb = () => {} } = {}) {
  if (window.getComputedStyle(target).display === "block") fadeOut(target, easing, duration, cb);
  else fadeIn(target, easing, duration, cb);
}

//#endregion fade

export function dragElement(el) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  const header = $el(`#${el.id}header`);
  if (header) header.onmousedown = dragMouseDown;
  else el.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    el.style.top = el.offsetTop - pos2 + "px";
    el.style.left = el.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
