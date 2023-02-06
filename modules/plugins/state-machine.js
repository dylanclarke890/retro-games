export const StateMachineMixin = (superclass) =>
  class extends superclass {
    stateMachine = {};

    ready() {
      super.ready();
      this.setState(this.stateMachine.initialState);
    }

    setState(state) {
      this._currentState = state;
      this._currentUpdate = this["update" + state];
      if (this["on" + state]) this["on" + state]();
    }

    stateIs(state) {
      return this._currentState === state;
    }

    transition(transition) {
      const stateDefinition = this.stateMachine[this._currentState];
      if (!stateDefinition) return;
      const transitions = stateDefinition.on;
      if (!transitions || !transitions[transition]) return;
      this.setState(transitions[transition]);
    }

    update() {
      if (this._currentUpdate) this._currentUpdate(super.update);
      else super.update();
    }
  };
