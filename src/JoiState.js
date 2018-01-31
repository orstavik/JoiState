class JoiState {

  constructor(initial) {
    this.reducers = {};
    this.computer = new JoiCompute(100);
    this.observer = new JoiCompute(1);
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

  /**
   * Hook. Called after every completed run triggered by a new action.
   * @param {{}} newState the state after reducer and all computers have finished processing.
   */
  onComplete(newState) {
  }

  /**
   * Hook. Called every time an error is thrown when a reducer, computer or observer is called.
   * By default, all Errors are just thrown upwards.
   * @param {Error} error
   */
  onError(error) {
    throw error;
  }

  /**
   * Hook. Called after every run triggered by a new action, both when the run completes and when it errors.
   * @param {{}} newState the state after reducer and all computers have finished processing.
   */
  onDebug(task, startState, reducedState, newState, computer, observer, error) {
  }

  _run(task) {
    let error, startState, reducedState;
    try {
      startState = this.state;
      reducedState = task.reducer(startState, task.event.detail);  //1. reduce
      if (startState !== reducedState) {
        this.state = this.computer.update(reducedState);                //2. compute
        this.observer.update(this.state);                                    //3. observe
      }
      this.onComplete(this.state);
    } catch (err) {
      this.onError(error = err);
    } finally {
      this.onDebug(task, startState, reducedState, this.state, this.computer, this.observer, error);
    }
  }
}