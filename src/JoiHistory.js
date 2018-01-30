class JoiHistory {

  constructor(state) {
    this.history = [];
    state.bindOnEnd(this.addToHistory.bind(this));
    // window.addEventListener("state-history-get", e => JoiHistory.fire("state-history", this.history));
    //this object will fireAndSetGlobalVariable its history when queried.
  }

  addToHistory(state, debugInfo) {
    debugInfo.task = JoiHistory._simplifyTask(debugInfo.task);
    debugInfo.newState = state;
    debugInfo.computerInfo = debugInfo.computerInfo.functionsRegister;
    debugInfo.observerInfo = debugInfo.observerInfo.functionsRegister;
    this.history = [debugInfo].concat(this.history);
    // if (this.history.length > 100) this.history = this.history.slice(0,50);
    JoiHistory.fire("state-history-changed", this.history);
  }

  static _simplifyTask(task) {
    task.stop = performance.now();
    task.timeOrigin = performance.timeOrigin;
    task.event = {type: task.event.type, detail: task.event.detail};
    task.taskName = task.reducer.name;
    return task;
  }

  static fire(name, detail) {
    window.dispatchEvent(new CustomEvent(name, {composed: true, bubbles: true, detail: detail}));
  }
}

// class tww extends JoiState {
//
//   constructor(initState) {
//     super(initState);
//     this.history = [];
//   }
//
//   _run(task) {
//     super._run(task);
//     this.history = [task].concat(this.history);
//   }
// }