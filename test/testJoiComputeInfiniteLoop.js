const expectedErrorMsg = `Error: StackOverFlowError in JoiCompute (JoiState), probably an infinite loop.
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]
[_c = sum(a, _b)]
[_b = sum(a, _c)]`;

describe('Infinite loop and NaN', function () {

  const reducerEventName = 'state-test-infinte';
  const startState = {
    a: 1
  };
  const state = new JoiState(startState);

  it("make sure an infinite loop happens", function () {
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "a", detail);
    };
    const sum = function (a, b) {
      return (a || 0) + (b || 0);
    };
    state.bindReduce(reducerEventName, reducerOne, true);
    state.bindCompute("_b", sum, ["a", "_c"]);   //infinite loop, when _b is updated,
    state.bindCompute("_c", sum, ["a", "_b"]);   // _c will need to be recalculated, and that triggers update of _b again
    const computeTestValue = fireAndSetGlobalVariable(reducerEventName, 2, "state-error");

    let res = window[computeTestValue].toString();
    expect(expectedErrorMsg).to.be.equal(res);
  });

  it("the engine understands that a value changing from NaN to NaN is not a change", function () {
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "a", detail);
    };
    const sum = function (a, b) {
      return a + b;                //this returns NaN when b is not a number, which will give a different error
    };
    state.bindReduce(reducerEventName, reducerOne, true);
    state.bindCompute("_b", sum, ["a", "_c"]);   //infinite loop, when _b is updated,
    state.bindCompute("_c", sum, ["a", "_b"]);   // _c will need to be recalculated, and that triggers update of _b again
    const computeTestValue = fireAndSetGlobalVariable(reducerEventName, 2, "state-changed");

    expect(window[computeTestValue].a).to.be.equal(2);
    expect(window[computeTestValue]._b).to.be.NaN;
    expect(window[computeTestValue]._c).to.be.NaN;
  });
});

