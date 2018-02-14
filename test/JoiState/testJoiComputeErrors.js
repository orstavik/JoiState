import {JoiState, JoiGraph} from "../../src/JoiState.js";

describe('JoiState Errors', function () {

  it("JoiState simple error", function (done) {
    const reducerFail = function (state) {
      throw new Error("i should fail");
    };
    const state = new JoiState();
    state.bindReduce('state-test-fail', reducerFail, true);
    state.onError = function (error) {
      expect("Error: i should fail").to.be.equal(error.toString());
      state.destructor();
      done();
    };
    window.dispatchEvent(new CustomEvent('state-test-fail', {bubbles: true, composed: true}));
  });

  it("JoiState still works after error", function (done) {
    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "a", e.detail);
    };
    const reducerFail = function (state, detail) {
      throw new Error("i should fail");
    };
    const state = new JoiState({a: 1});
    state.bindReduce('state-test-fail', reducerFail, true);
    state.bindReduce('state-test-working', reducerOne, true);
    state.onError = function (error) {
      expect("Error: i should fail").to.be.equal(error.toString());
    };
    let firstTime = true;
    state.bindOnComplete (newState => {
      if (firstTime) {
        expect(newState.a).to.be.equal(1);
        firstTime = false;
      } else {
        expect(newState.a).to.be.equal(3);
        state.destructor();
        done();
      }
    });
    window.dispatchEvent(new CustomEvent('state-test-fail', {bubbles: true, composed: true, detail: null}));
    window.dispatchEvent(new CustomEvent('state-test-working', {bubbles: true, composed: true, detail: 3}));
  });

  it("make sure an infinite loop happens", function (done) {
    const expectedErrorMsg =
`JoiStateStackOverflowError: Infinite loop or too complex computes in JoiState.
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]`;
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "a", detail);
    };
    const sum = function (a, b) {
      return (a || 0) + (b || 0);
    };
    const state = new JoiState({a: 1});
    state.bindReduce('state-test-infinte', reducerOne, true);
    state.bindCompute("_b", sum, ["a", "_c"]);   //infinite loop, when _b is updated,
    state.bindCompute("_c", sum, ["a", "_b"]);   // _c will need to be recalculated, and that triggers update of _b again
    state.onError = function (error) {
      expect(expectedErrorMsg).to.be.equal(error.toString());
      state.destructor();
      done();
    };
    window.dispatchEvent(new CustomEvent('state-test-infinte', {bubbles: true, composed: true, detail: 2}));
  });
});