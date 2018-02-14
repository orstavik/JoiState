import {JoiState, JoiGraph} from "../../src/JoiState.js";

describe('JoiState Que', function () {

  it("Event thrown from observers that trigger new reducer actions must be queued.", function (done) {

    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "a", e.detail);
    };
    const reducerTwo = function (state, e) {
      return JoiGraph.setIn(state, "b", e.detail);
    };
    const observeOne = function (a) {
      window.dispatchEvent(new CustomEvent('state-test-observe-event', {detail: "B"}));
    };
    const observeTwo = function (a) {
      window.dispatchEvent(new CustomEvent('state-test-observe-event-2', {detail: "C"}));
    };
    const state = new JoiState();
    state.bindReduce('state-test-observe-event', reducerOne, true);
    state.bindReduce('state-test-observe-event-2', reducerTwo, true);
    state.bindObserve(observeOne, ["a"]);
    state.bindObserve(observeTwo, ["a"]);

    let count = 0;
    state.bindOnComplete ( function (newState) {
      if (count === 0)
        expect(newState).to.deep.equal({a: "A"});
      else if (count === 1)
        expect(newState).to.deep.equal({a: "B"});
      else if (count === 2) {
        expect(newState).to.deep.equal({a: "B", b: "C"});
        done();
      }
      count++;
    });
    window.dispatchEvent(new CustomEvent('state-test-observe-event', {detail: "A"}));
  });
});