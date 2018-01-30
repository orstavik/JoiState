class JoiState {

  constructor(initial) {
    this.reducers = {};
    this.computer = new JoiCompute(100);
    this.observer = new JoiCompute(1);
    this.onEndFunctions = [];
    this.state = JoiGraph.deepFreeze(initial || {});
  }

  destructor() {
    for (let type in this.reducers)
      this.detachReducer(type);
  }

  bindReduce(eventName, reducer) {
    this.reducers[eventName] = event => this._run({event, reducer, start: performance.now()});
    window.addEventListener(eventName, this.reducers[eventName]);
  }

  detachReducer(eventName) {
    window.removeEventListener(eventName, this.reducers[eventName]);
    delete this.reducers[eventName];
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
    if (startState !== reducedState) {
      let computedState = this.computer.update(reducedState);        //2. compute
      this.observer.update(computedState);                           //3. observe
      this.state = computedState;
    }
    let computerInfo = this.computer;
    let observerInfo = this.observer;
    for (let func of this.onEndFunctions)
      func(this.state, {task, startState, reducedState, computerInfo, observerInfo});
  }
}