class JoiState {

  constructor(initial) {
    this.computer = new JoiCompute(100);
    this.observer = new JoiCompute(0);
    this.state = JoiGraph.deepFreeze(initial || {});
    this.que = [];

    this.history = [];
    window.addEventListener("state-history-get", e => JoiState.emit("state-history", this.history));     //this object will fireAndSetGlobalVariable its history when queried.
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
    const e = task.event;
    let startState = this.state;
    let reducedState = reducer(startState, e.detail);         //1. reduce
    let computedState, error;
    if (startState !== reducedState) {
      try {
        computedState = this.computer.update(reducedState);     //2. compute
        this.observer.update(computedState);                    //3. observe
        this.state = computedState;
      } catch (err) {
        console.error(err);
        error = err;
      }
    }
    this.que.shift();
    const snapShot = JoiState._takeSnapshot(error, startState, reducedState, computedState, this.state, task, this.computer, this.observer, start, this.que);
    this.history = [snapShot].concat(this.history);
    // if (this.history.length > 100) this.history = this.history.slice(0,50);
    if (error) {
      JoiState.emit("state-error", error);
    } else {
      JoiState.emit("state-changed", this.state);
    }
    JoiState.emit("state-history-changed", this.history);
    // if (this.que.length > 100) setTimeout(()=> this.reduceComputeObserveInner(this.que[0]), 0);
    if (this.que.length > 0)
      this.reduceComputeObserveInner(this.que[0]);
  }

  static _takeSnapshot(error, startState, reducedState, computedState, newState, task, computerInfo, observerInfo, start, que) {
    task.taskName = task.reducer.name;
    task.event = {type: event.type, detail: event.detail};
    task.start = start;
    task.stop = performance.now();
    return {
      error,
      startState,
      reducedState,
      computedState,
      newState,
      task,
      computerInfo: computerInfo.functionsRegister,
      observerInfo: observerInfo.functionsRegister,
      que: que.slice(0)
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

