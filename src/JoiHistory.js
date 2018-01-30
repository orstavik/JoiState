class JoiStateWithHistory extends JoiState {

  constructor(initState) {
    super(initState);
    this.history = [];
    window.addEventListener("state-history-get", e => JoiHistory.fire("state-history", this.history));
  }

  _run(task) {
    super._run(task);
    this.history = [this._getHistoryData()].concat(this.history);
    JoiStateWithHistory.fire("state-history-changed", this.history);
  }

  _getHistoryData() {
    let computerInfo = this.computer.functionsRegister;
    let observerInfo = this.observer.functionsRegister;
    let startState = this.startState;
    let reducedState = this.reducedState;
    let task = JoiStateWithHistory._simplifyTask(this.task);
    let failed = this.failed;
    let newState = this.state;
    return {newState, task, startState, reducedState, computerInfo, observerInfo, failed};
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