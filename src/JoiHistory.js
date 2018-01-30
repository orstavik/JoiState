class JoiHistory {

  constructor() {
    this.history = [];
    window.addEventListener("state-history-get", e => JoiState.emit("state-history", this.history));
    //this object will fireAndSetGlobalVariable its history when queried.
  }

  addToHistory(state, error, startState, reducedState, computedState, task, computer, observer) {
    const snapShot = JoiHistory._takeSnapshot(error, startState, reducedState, computedState, state, task, computer, observer);
    this.history = [snapShot].concat(this.history);
    // if (this.history.length > 100) this.history = this.history.slice(0,50);
    JoiState.emit("state-history-changed", this.history);
  }

  static _takeSnapshot(error, startState, reducedState, computedState, newState, task, computerInfo, observerInfo) {
    task.taskName = task.reducer.name;
    task.event = {type: task.event.type, detail: task.event.detail};
    task.timeOrigin = performance.timeOrigin;
    task.stop = performance.now();
    return {
      error,
      startState,
      reducedState,
      computedState,
      newState,
      task,
      computerInfo: computerInfo.functionsRegister,
      observerInfo: observerInfo.functionsRegister
    };
  }
}

