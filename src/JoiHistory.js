class JoiHistory {

  constructor() {
    this.history = [];
    window.addEventListener("state-history-get", e => JoiState.fire("state-history", this.history));
    //this object will fireAndSetGlobalVariable its history when queried.
  }

  addToHistory(state, debugInfo) {
    debugInfo.task = JoiHistory._simplifyTask(debugInfo.task);
    debugInfo.newState = state;
    debugInfo.computerInfo = debugInfo.computerInfo.functionsRegister;
    debugInfo.observerInfo = debugInfo.observerInfo.functionsRegister;
    this.history = [debugInfo].concat(this.history);
    // if (this.history.length > 100) this.history = this.history.slice(0,50);
    JoiState.fire("state-history-changed", this.history);
  }

  static _simplifyTask(task) {
    task.stop = performance.now();
    task.timeOrigin = performance.timeOrigin;
    task.event = {type: task.event.type, detail: task.event.detail};
    task.taskName = task.reducer.name;
    return task;
  }
}