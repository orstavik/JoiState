class JoiState {

  constructor(initial) {
    this.computer = new JoiCompute(100);
    this.observer = new JoiCompute(0);
    this.state = JoiGraph.deepFreeze(initial || {});
    this.que = [];
    this.history = new JoiHistory();
  }

  bindReduce(eventName, reducer) {
    window.addEventListener(eventName, event => this._run({event, reducer, start: performance.now()}));
  }

  bindCompute(returnProp, computeFunc, argsAsStrings) {
    this.computer.bind(computeFunc, argsAsStrings, returnProp);
  }

  bindObserve(observeFunc, argsAsStrings) {
    this.observer.bind(observeFunc, argsAsStrings);
  }

  _run(task) {
    let startState = this.state;
    let reducedState = task.reducer(startState, task.event.detail);         //1. reduce
    let computedState, error;
    if (startState !== reducedState) {
      try {
        computedState = this.computer.update(reducedState);                 //2. compute
        this.observer.update(computedState);                                //3. observe
        this.state = computedState;
        JoiState.emit("state-changed", this.state);
      } catch (err) {
        console.error(err);
        error = err;
        JoiState.emit("state-error", error);
      }
    }
    this.history.addToHistory(error, startState, reducedState, computedState, this.state, task, this.computer, this.observer, this.que);
  }

  static emit(name, detail) {
    return window.dispatchEvent(new CustomEvent(name, {composed: true, bubbles: true, detail: detail}));
  }
}