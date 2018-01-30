describe('compute handles NaN correctly', function () {

  it("the engine understands that a value changing from NaN to NaN is not a change", function (done) {
    const reducerEventName = 'state-test-infinte2';
    const startState = {
      a: 1
    };
    const state = new JoiState(startState);

    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "a", detail);
    };
    const sum = function (a, b) {
      return a + b;                //this returns NaN when b is not a number, which will give a different error
    };
    state.bindReduce(reducerEventName, reducerOne, true);
    state.bindCompute("_b", sum, ["a", "_c"]);   //infinite loop, when _b is updated,
    state.bindCompute("_c", sum, ["a", "_b"]);   // _c will need to be recalculated, and that triggers update of _b again
    state.bindOnEnd(newState => {
      expect(newState.a).to.be.equal(2);
      expect(newState._b).to.be.NaN;
      expect(newState._c).to.be.NaN;
      done();
    });
    window.dispatchEvent(new CustomEvent(reducerEventName, {bubbles: true, composed: true, detail: 2}));
  });
});

