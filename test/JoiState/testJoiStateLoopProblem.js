describe('JoiState loop problem', function () {

  it("Event thrown from observers that trigger new reducer actions must be queued. " +
    "Loop that never ends problem, ensure that events triggered by observes are queued", function (done) {

    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "a", detail);
    };
    const observeOne = function (a) {
      window.dispatchEvent(new CustomEvent('state-test-observe-event', {detail: "B"}));
    };
    const state = new JoiState();
    state.bindReduce('state-test-observe-event', reducerOne, true);
    state.bindObserve(observeOne, ["a"]);

    let count = 0;
    state.onComplete = function (newState) {
      if (count === 0) {
        expect(newState).to.deep.equal({a: "A"});
        firstTime = false;
      } else {
        expect(newState).to.deep.equal({a: "B"});
      }
      if (count === 2){
        // state.destructor();
        done();
      }
      count++;
    };
    window.dispatchEvent(new CustomEvent('state-test-observe-event', {detail: "A"}));
  });
});