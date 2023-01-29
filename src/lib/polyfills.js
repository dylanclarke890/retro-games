//#region performance.now()
(function polyfillPerformanceNow() {
  const moduleLoadTime = Date.now();
  if (window.performance && performance.now) return;
  window.performance = {
    now: () => Date.now() - moduleLoadTime,
  };
})();

//#endregion performance.now()

//#region requestAnimationFrame()

const QUEUE = [];

let id = 0;
let last = 0;

export function requestFixedTick(cb, fps = 60) {
  if (QUEUE.length === 0) {
    const frame = performance.now();
    const next = Math.max(0, 1000 / fps - (frame - last));
    last = frame + next;

    setTimeout(() => {
      const stack = QUEUE.slice(0);
      QUEUE.length = 0;
      for (let i = 0; i < stack.length; i++) if (!stack[i].cancelled) stack[i].callback(last);
    }, next);
  }

  QUEUE.push({
    handle: ++id,
    cancelled: false,
    callback: cb,
  });
  return id;
}

export function raf(cb, fps = -1) {
  if (fps < 0 && requestAnimationFrame) return requestAnimationFrame(cb);
  return requestFixedTick(cb, fps);
}

export function caf(id) {
  if (cancelAnimationFrame) cancelAnimationFrame(id);
  for (let i = 0; i < QUEUE.length; i++) if (QUEUE[i].handle === id) QUEUE[i].cancelled = true;
}

//#endregion requestAnimationFrame()
