class JoiState {

  constructor(initial) {
    this.state = {};
    this.history = [];
    this.computer = new JoiCompute(100, false);
    this.observer = new JoiCompute(0, true);

    this.state = JoiGraph.deepFreeze(initial);
    this.history = [];
    this.que = [];
    window.addEventListener("state-get-history", e => JoiState.emit("state-history-changed", this.history));     //this object will fireAndSetGlobalVariable its history when queried.
  }

  bindReduce(eventName, reducer, throttle = true) {
    window.addEventListener(eventName, e => this._runOrAddToQue(e, reducer, throttle));
  }

  bindCompute(returnProp, computeFunc, argsAsStrings) {
    this.computer.bind(computeFunc, argsAsStrings, returnProp);
  }

  bindObserve(observeFunc, argsAsStrings) {
    this.observer.bind(observeFunc, argsAsStrings);
  }

  _runOrAddToQue(e, reducer, throttle) {
    if (throttle && this._throttleEventReducers(this.que, reducer, e))
      return;
    const task = {event: e, reducer: reducer, added: new Date().getTime()};
    this.que.push(task);
    if (this.que[0] === task)
      return this.reduceComputeObserveInner(task);
  }

  _throttleEventReducers(reducer, event) {
    let i = this.que.findIndex(existingTask => existingTask.reducer === reducer);
    if (i === -1)
      return false;
    this.que[i] = {event, reducer, added: new Date().getTime(), overWritesTask: this.que[i]};
    return true;
  }

  reduceComputeObserveInner(task) {
    let start = performance.now();
    const reducer = task.reducer;
    const startQueLength = this.que.length - 1;              //for debug
    const e = task.event;
    let startState = this.state;
    let reducedState = reducer(startState, e.detail);       //1. reduce
    let computedState;
    if(startState !== reducedState){                                                 //todo we need a try catch around compute so to make a good error message
      computedState = this.computer.update(reducedState); //2. compute
      this.observer.update(computedState);                    //3. observe
      this.state = computedState;
    }
    this.que.shift();
    const snapShot = JoiState._takeSnapshot(startState, reducedState, computedState, this.state, task, this.computer, this.observer, start, startQueLength, this.que.splice());
    this.history = [snapShot].concat(this.history);
    // if (this.history.length > 100)
    //   this.history.slice(0,50);
    JoiState.emit("state-changed", this.state);
    JoiState.emit("state-history-changed", this.history);
    // if (this.que.length > 100)
    //   setTimeout(()=> this.reduceComputeObserveInner(this.que[0]), 0);
    if (this.que.length > 0)
      this.reduceComputeObserveInner(this.que[0]);
  }

  static _takeSnapshot(startState, reducedState, computedState, newState, task, computerInfo, observerInfo, start, startQueLength, que) {
    task.taskName = task.reducer.name;
    task.event = {type: event.type, detail: event.detail};
    task.start = start;
    task.stop = performance.now();
    return {
      startState,
      reducedState,
      computedState,
      newState,
      task,
      computerInfo: computerInfo.functionsRegister,
      observerInfo: observerInfo.functionsRegister,
      startQueLength,
      que
    };
  }

  static emit(name, payload) {
    return window.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: payload,
    }));
  }
}

