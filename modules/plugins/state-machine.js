export const StateMachinePlugin = {
  ready() {
    this.parent();
    this.setState(this.stateMachine.initialState);
  },

  setState(state) {
    this._currentState = state;
    this._currentUpdate = this["_update_" + state];
    if (typeof this["_on_" + state] === "function") this["on_" + state]();
  },

  stateIs(state) {
    return this._currentState === state;
  },

  transition(transition) {
    const stateDefinition = this.stateMachine[this._currentState];
    if (!stateDefinition) return;
    const transitions = stateDefinition.on;
    if (!transitions || !transitions[transition]) return;
    this.setState(transitions[transition]);
  },

  update() {
    if (this._currentUpdate) this._currentUpdate(this.parent);
    else this.parent();
  },
};
