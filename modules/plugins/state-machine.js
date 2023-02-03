export const StateMachinePlugin = [
  {
    name: "ready",
    value: function () {
      this.parent();
      this.setState(this.stateMachine.initialState);
    },
  },

  {
    name: "setState",
    value: function (state) {
      this._currentState = state;
      this._currentUpdate = this["update_" + state];
      if (typeof this["_on_" + state] === "function") this["on_" + state]();
    },
  },

  {
    name: "stateIs",
    value: function (state) {
      return this._currentState === state;
    },
  },

  {
    name: "transition",
    value: function (transition) {
      const stateDefinition = this.stateMachine[this._currentState];
      if (!stateDefinition) return;
      const transitions = stateDefinition.on;
      if (!transitions || !transitions[transition]) return;
      this.setState(transitions[transition]);
    },
  },

  {
    name: "update",
    value: function () {
      if (this._currentUpdate) this._currentUpdate(this.parent);
      else this.parent();
    },
  },
];
