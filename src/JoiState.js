//todo rename to JoiStore to echo pattern names
class JoiState {

  constructor(initial) {
    this.reducers = {};
    this.computer = new JoiCompute(100, false);
    this.observer = new JoiCompute(1, true);
    this.state = JoiGraph.deepFreeze(initial || {});
    this.que = [];
  }

  destructor() {
    for (let type in this.reducers)
      this.detachReducer(type);
  }

  /**
   * Main control flow of the JoiState machine.
   * 1. Call the single reduce function with the event detail based on the event type captured.
   * 2. Update all computed values based on all the computed functions bound based on the state changes caused by the reducer.
   * 3. Check all the observer functions bound based on the state changes done by the reducer and computer functions.
   * 4. Call the onComplete hook with the newState, and other debug values if needed.
   * X. If any Errors are thrown during reduction, computation or observation, then call onError.
   * @param task
   * @private
   */
  _run(task) {
    let error, reducedState, startState = this.state;
    try {
      reducedState = task.reducer(startState, task.event);
      if (startState !== reducedState) {
        this.state = this.computer.update(reducedState);
        this.observer.update(this.state);
      }
    } catch (err) {
      this.onError(error = err);
    } finally {
      this.onComplete(this.state, task, startState, reducedState, this.computer, this.observer, error);
    }
  }

  /**
   * Dispatch a reducer action.
   * The dispatcher firsts ques all requests to ensure they are executed one by one.
   * When the que is ready, the given reducer function is called with the given data payload on the state.
   * @param {Function} reducer a static function such as MyReducers.seducerFunction1
   * @param {{}} data object passed as second argument to the reducer.
   */
  dispatch(reducer, data){
    this.que.push({event: data, reducer, start: performance.now()});
    if (this.que.length >= 2) //someone else is already running the que, this flow of control resigns
      return;
    while (this.que.length > 0){
      this._run(this.que[0]);
      this.que.shift();
    }
  }

  //todo rename addEventReducer??
  bindReduce(eventName, reducer) {
    this.reducers[eventName] = event => this.dispatch(reducer, event);
    window.addEventListener(eventName, this.reducers[eventName]);
  }

  //todo rename removeEventReducer??
  detachReducer(eventName) {
    window.removeEventListener(eventName, this.reducers[eventName]);
    delete this.reducers[eventName];
  }

  //todo rename: compute(argsAsStrings, computeFunc, returnProp) to mirror redux naming
  bindCompute(returnProp, computeFunc, argsAsStrings) {
    this.computer.bind(computeFunc, argsAsStrings, returnProp);
  }

  //todo rename: observe(argsAsStrings, observeFunc) to mirror redux naming
  bindObserve(observeFunc, argsAsStrings) {
    this.observer.bind(observeFunc, argsAsStrings);
  }

  /**
   * Hook. Called after every run triggered by a new action.
   * @param {{}} newState the state after reducer and all computers have finished processing.
   */
  onComplete(newState, task, startState, reducedState, computer, observer, error) {
  }

  /**
   * Hook. Called every time an error is thrown when a reducer, computer or observer is called.
   * By default, all Errors are just catch'n'released.
   * @param {Error} error
   */
  onError(error) {
    throw error;
  }
}