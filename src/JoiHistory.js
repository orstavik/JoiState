class JoiStateWithFullHistory extends JoiState {

  constructor(initState) {
    super(initState);
    this.history = [];
    window.addEventListener("state-history-get", e => JoiHistory.fire("state-history", this.history));
    //todo this i should just query as joiState.history??
  }

  onComplete(newState, task, startState, reducedState, computer, observer, error) {
    const snap = {
      task: JoiStateWithFullHistory._simplifyTask(task),
      newState,
      startState,
      reducedState,
      computerInfo: computer.functionsRegister,
      observerInfo: observer.functionsRegister,
      error
    };
    this.history.push(snap);
    this.onHistoryChanged(this.history);
  }

  /**
   * Hook! use this to do something whenever the history changes
   */
  onHistoryChanged(history){
    //todo attach to this point directly instead of communicating through events.
    JoiStateWithFullHistory.fire("state-history-changed", history);
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