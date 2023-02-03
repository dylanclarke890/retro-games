import { removeItem } from "../lib/array-utils.js";

export const ObservablePlugin = [
  { name: "_listeners", value: {}, isStatic: false },
  {
    name: "on",
    value: function (eventName, handler) {
      const listeners = (this._listeners[eventName] ??= []);
      listeners.push(handler);
    },
    isStatic: false,
  },
  {
    name: "off",
    value: function (eventName, handler) {
      const listeners = this._listeners[eventName];
      if (!listeners) return;
      if (handler) removeItem(listeners, handler);
      else this._listeners = [];
    },
    isStatic: false,
  },
  {
    name: "trigger",
    value: function (eventName, data) {
      const listeners = this._listeners[eventName];
      if (!listeners) return;
      for (let i = 0; i < listeners.length; i++) listeners[i].apply(this, data);
    },
    isStatic: false,
  },
];
