class JoiState {

  constructor(initial) {
    this.computer = new JoiCompute(100);
    this.observer = new JoiCompute(0);
    this.state = JoiGraph.deepFreeze(initial || {});
    this.que = [];

    this.history = new JoiHistory();
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

  //todo make a test for this in an async multithreaded environment
  //todo this que is untested and unsafe in a multithreaded environment..
  _runOrAddToQue(e, reducer, throttle) {
    //first, I add to/update the que items. This i always do.
    this.que = JoiState._updateQueOrAddToTheEndOfQue(this.que, reducer, e, throttle);
    //second, I check if I am the thread that should run this que, or if another thread is already running on this que.
    //now, i do this by checking if the que.length is bigger than 0. This will not work. This can cause 2 threads to start working on it.
    //maybe.. if you have web workers.. can that ever be the case?? can i ever get the reducer to be triggered from 2 places at the same time??
    while (this.que.length > 0)
      this._reduceComputeObserveInner(this.que.shift());      // if (this.que.length > 100) setTimeout(()=> this._reduceComputeObserveInner(this.que[0]), 0);
  }

  _reduceComputeObserveInner(task) {
    let start = performance.now();
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
    this.history.addToHistory(error, startState, reducedState, computedState, this.state, task, this.computer, this.observer, start, this.que);
  }

  //todo this now mutates the que. I think this is the right approach, but im not sure
  static _updateQueOrAddToTheEndOfQue(que, reducer, event, throttle) {
    const task = {event, reducer, added: new Date().getTime()};
    if (throttle) {
      let i = que.findIndex(existingTask => existingTask.reducer === reducer);
      if (i >= 0){
        task.overWritesTask = que[i];
        que[i] = task;
        return que;
      }
    }
    que.push(task);
    return que;
  }

  static emit(name, payload) {
    return window.dispatchEvent(new CustomEvent(name, {
      composed: true,
      bubbles: true,
      detail: payload,
    }));
  }
}

