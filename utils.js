function loadScript(srcUrl, isAsync = true, type = "text/javascript") {
  return new Promise((resolve, reject) => {
    try {
      const scriptElement = document.createElement("script");
      scriptElement.addEventListener("load", () => resolve({ status: true }));
      scriptElement.addEventListener("error", () =>
        reject({
          status: false,
          message: `Failed to load the script ${srcUrl}`,
        })
      );
      scriptElement.type = type;
      scriptElement.async = isAsync;
      scriptElement.src = srcUrl;

      document.body.appendChild(scriptElement);
    } catch (error) {
      reject(error);
    }
  });
}

function randUpTo(num, floor = false) {
  const res = Math.random() * num;
  return floor ? Math.floor(res) : res;
}

function isCircleRectColliding(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.w / 2);
  const distY = Math.abs(circle.y - rect.y - rect.h / 2);
  if (distX > rect.w / 2 + circle.r) return false;
  if (distY > rect.h / 2 + circle.r) return false;
  if (distX <= rect.w / 2) return true;
  if (distY <= rect.h / 2) return true;
  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function isRectRectColliding(first, second) {
  if (!first || !second) return false;
  if (
    !(
      first.x > second.x + second.w ||
      first.x + first.w < second.x ||
      first.y > second.y + second.h ||
      first.y + first.h < second.y
    )
  ) {
    return true;
  }
  return false;
}
