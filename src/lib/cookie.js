/**
 * Gets a cookie value.
 * @see https://www.w3schools.com/js/js_cookies.asp
 * @param {string} name The cookie name.
 * @return {string|undefined} The cookie value or "undefined", if not set.
 */
export function getCookie(name) {
  const cName = name + "=";
  const cookieArr = document.cookie.split(";");
  let cookie;
  for (let i = 0; i < cookieArr.length; i++) {
    let cookie = cookieArr[i];
    while (cookie.charAt(0) === " ") cookie = cookie.substring(1);
    if (cookie.indexOf(cName) === 0) cookie = cookie.substring(cName.length, cookie.length);
  }
  return cookie;
}

/**
 * Sets a cookie value.
 * @see https://www.w3schools.com/js/js_cookies.asp
 * @param {string} name The cookie name.
 * @param {string} value The cookie value.
 * @param {number|undefined} exdays Number of days after which the cookie expires,
 * or "undefined" to make the cookie expire at the end of the session.
 * @return {undefined}
 */
export function setCookie(name, value, exdays) {
  let expires = "";
  if (exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    expires = "expires=" + d.toUTCString() + ";";
  }
  document.cookie = name + "=" + value + ";" + expires + "path=/";
}

/**
 * Unsets a cookie.
 * @param {string} cookieName The cookie name.
 * @return {undefined}
 */
export function clearCookie(cookieName) {
  setCookie(cookieName, "", -365);
}
