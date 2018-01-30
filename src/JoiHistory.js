class JoiHistory {

  constructor() {
    this.history = [];
    window.addEventListener("state-history-get", e => JoiState.emit("state-history", this.history));
    //this object will fireAndSetGlobalVariable its history when queried.
  }

  addToHistory(error, startState, reducedState, computedState, state, task, computer, observer, que) {
    const snapShot = JoiHistory._takeSnapshot(error, startState, reducedState, computedState, state, task, computer, observer, que);
    this.history = [snapShot].concat(this.history);
    // if (this.history.length > 100) this.history = this.history.slice(0,50);
    JoiState.emit("state-history-changed", this.history);
  }

  static _takeSnapshot(error, startState, reducedState, computedState, newState, task, computerInfo, observerInfo, que) {
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
      observerInfo: observerInfo.functionsRegister,
      que: que.slice(0)
    };
  }
}

