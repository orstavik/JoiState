import {JoiState, JoiGraph} from "../../src/JoiState.js";

describe('JoiState Que', function () {

  it("Dispatches from observers that trigger new reducer actions must be queued.", function () {

    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "a", e);
    };
    const reducerTwo = function (state, e) {
      return JoiGraph.setIn(state, "b", e);
    };
    const observeOne = function (a) {
      state.dispatch(reducerOne, "B");
    };
    const observeTwo = function (a) {
      state.dispatch(reducerTwo, "C")
    };
    const state = new JoiState();
    state.bindObserve(observeOne, ["a"]);
    state.bindObserve(observeTwo, ["a"]);

    let count = 0;
    state.bindOnComplete(function (newState) {
      if (count === 0)
        expect(newState).to.deep.equal({a: "A"});
      else if (count === 1)
        expect(newState).to.deep.equal({a: "B"});
      else if (count <= 4)
        expect(newState).to.deep.equal({a: "B", b: "C"});
      else
        assert(false);
      count++;
    });
    state.dispatch(reducerOne, "A");
  });
});