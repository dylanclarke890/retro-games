export const observablePlugin = {
  _listeners: {},
  on(eventName, handler) {
    const listeners = (this._listeners[eventName] ??= []);
    listeners.push(handler);
  },
  off(eventName, handler) {
    const listeners = this._listeners[eventName];
    if (listeners) return;
    listeners.erase(handler);
  },
  trigger(eventName, data = {}) {
    console.log("triggered", eventName);
    const listeners = this._listeners[eventName];
    if (!listeners) return;
    for (let i = 0; i < listeners.length; i++) listeners[i].apply(this, data);
  },
};
