import {JoiStore, JoiGraph} from "../../src/JoiStore.js";

describe('JoiStore Que', function () {

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
    const state = new JoiStore();
    state.observe(["a"], observeOne);
    state.observe(["a"], observeTwo);

    let count = 0;
    state.onComplete(function (newState) {
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