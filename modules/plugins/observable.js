import { removeItem } from "../lib/array-utils.js";

export const ObservablePlugin = {
  _listeners: {},
  on(eventName, handler) {
    const listeners = (this._listeners[eventName] ??= []);
    listeners.push(handler);
  },
  off(eventName, handler) {
    const listeners = this._listeners[eventName];
    if (!listeners) return;
    if (handler) removeItem(listeners, handler);
    else this._listeners = [];
  },
  trigger(eventName, data = {}) {
    const listeners = this._listeners[eventName];
    if (!listeners) return;
    for (let i = 0; i < listeners.length; i++) listeners[i].apply(this, data);
  },
};
