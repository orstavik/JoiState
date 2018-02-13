class JoiStateWithFullHistory extends JoiState {

  constructor(initState) {
    super(initState);
    this.history = [];
    window.addEventListener("state-history-get", e =>
      window.dispatchEvent(new CustomEvent("state-history", {detail: this.history}))
    );
    //todo this i should just query as joiState.history??
  }

  onComplete(newState, task, startState, reducedState, computer, observer, error) {
    const snap = JoiStateWithFullHistory.makeSnap(task, newState, startState, reducedState, computer, observer, error);
    this.history.push(snap);
    this.onHistoryChanged(this.history);
  }

  /**
   * Hook! use this to do something whenever the history changes
   */
  onHistoryChanged(history){
    //todo attach to this point directly instead of communicating through events.
    window.dispatchEvent(new CustomEvent("state-history-changed", {detail: history}));
  }

  static makeSnap(task, newState, startState, reducedState, computer, observer, error) {
    return {
      task: JoiStateWithFullHistory._simplifyTask(task),
      newState,
      startState,
      reducedState,
      computerInfo: computer.functionsRegister,
      observerInfo: observer.functionsRegister,
      error
    };
  }

  static _simplifyTask(task) {
    task.stop = performance.now();
    task.timeOrigin = performance.timeOrigin;
    task.event = {type: task.event.type, detail: task.event.detail};
    task.taskName = task.reducer.name;
    return task;
  }

  /**
   * todo Make history only store the reduced values, not the computed values of the state using
   * todo .computeFromScratch(reducedState)
   * todo
   * todo The benefit of this approach is to have less data to store.
   * todo The computed values should always be the same anyways, so they can be recalculated as needed.
   */
}