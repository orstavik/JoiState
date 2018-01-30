class JoiState {

  constructor(initial) {
    this.reducers = {};
    this.computer = new JoiCompute(100);
    this.observer = new JoiCompute(1);
    this.onEndFunctions = [];
    this.state = JoiGraph.deepFreeze(initial || {});
    this.startState = {};
    this.reducedState = {};
    this.task = {};
    this.failed = false;
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
    this.task = task;
    this.failed = true;
    this.reducedState = null;
    this.startState = this.state;
    this.reducedState = task.reducer(this.startState, task.event.detail);  //1. reduce
    if (this.startState !== this.reducedState) {
      this.state = this.computer.update(this.reducedState);        //2. compute
      this.observer.update(this.state);                           //3. observe
      this.failed = false;
    }
    for (let func of this.onEndFunctions)
      func(this.state);
  }
}