class JoiState {

  constructor(initial) {
    this.listeners = {};
    this.computer = new JoiCompute(100);
    this.observer = new JoiCompute(1);
    this.onEndFunctions = [];
    this.state = JoiGraph.deepFreeze(initial || {});
  }

  bindReduce(eventName, reducer) {
    const listener = event => this._run({event, reducer, start: performance.now()});
    this.listeners[eventName] = listener;
    window.addEventListener(eventName, listener);
  }

  bindCompute(returnProp, computeFunc, argsAsStrings) {
    this.computer.bind(computeFunc, argsAsStrings, returnProp);
  }

  bindObserve(observeFunc, argsAsStrings) {
    this.observer.bind(observeFunc, argsAsStrings);
  }

  bindOnEnd(func) {
    this.onEndFunctions.push(func);
  }

  _run(task) {
    let startState = this.state;
    let reducedState = task.reducer(startState, task.event.detail);  //1. reduce
    let computedState, error;
    if (startState !== reducedState) {
      try {
        computedState = this.computer.update(reducedState);          //2. compute
        this.observer.update(computedState);                         //3. observe
        this.state = computedState;
        JoiState.emit("state-changed", this.state);
      } catch (err) {
        console.error(err);
        error = err;
        JoiState.emit("state-error", error);
      }
    }
    let computerInfo = this.computer;
    let observerInfo = this.observer;
    for (let func of this.onEndFunctions)
      func(this.state, {task, error, startState, reducedState, computerInfo, observerInfo});
  }

  static emit(name, detail) {
    return window.dispatchEvent(new CustomEvent(name, {composed: true, bubbles: true, detail: detail}));
  }

  detachReducer(eventName) {
    window.removeEventListener(eventName, this.listeners[eventName]);
  }

  detachReducers() {
    for (let eventName in this.listeners)
      this.detachReducer(eventName);
  }
}