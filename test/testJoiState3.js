describe('test confusable paths in computers/observers', function () {

  const reducerEventName = 'state-test-three';
  const computeTestValue = "computeTestValue3";
  const startState = {
    a: {
      b: 2
    },
    b: {
      c: 9
    },
    c: 1
  };
  const state = new JoiState(startState);

  it("confusable computers / observers", function () {
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "user", detail);
    };
    const computeOne = function (a, b) {
      return JSON.stringify(a) + JSON.stringify(b);
    };
    let counter = 0;
    const observeOne = function (a, b) {
      window["whatever_" + counter++] = computeOne(a, b);
    };
    state.bindReduce(reducerEventName, reducerOne, true);
    state.bindCompute("_d1", computeOne, ["a.b", "c"]);
    state.bindCompute("_d2", computeOne, ["a", "b.c"]);   // same computer function, different paths and return value
    state.bindCompute("_d3", computeOne, ["a", "b.c"]);   // same computer function, different return value only
    state.bindCompute("_d4", computeOne, ["a.b", "c"]);
    state.bindCompute("_d4", computeOne, ["a", "b.c"]);   // two computer functions writing to the same path, only the last should be active.
    state.bindObserve(observeOne, ["a.b", "c"]);
    state.bindObserve(observeOne, ["a", "b.c"]);          // same observer function, different paths
    state.bindObserve(computeOne, ["a", "b.c"]);          // should not throw any Errors
    fireAndSetGlobalVariable(reducerEventName, "whatever", computeTestValue);

    const testValue = Object.assign({}, startState);
    testValue.user = "whatever";
    testValue._d1 = "21";
    testValue._d2 = '{"b":2}9';
    testValue._d3 = '{"b":2}9';
    testValue._d4 = '{"b":2}9';
    expect(window[computeTestValue]).to.deep.equal(testValue);
    expect(window.whatever_0).to.be.equal("21");
    expect(window.whatever_1).to.be.equal('{"b":2}9');
  });
});

