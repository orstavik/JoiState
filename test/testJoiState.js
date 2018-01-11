describe('test of JoiState', function () {

  const reducerEventName = 'state-test-one';
  const startState = {
    a: "a string"
  };
  const state = new JoiState(startState);

  it("new JoiState", function () {
    expect(state.state).to.deep.equal({a: "a string"});
  });

  it("reducer", function () {

    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "reducerOne", detail);
    };
    state.bindReduce(reducerEventName, reducerOne, true);
    fireAndSetGlobalVariable(reducerEventName, "reduceData", "computeTestValue1");

    const testValue = {a: "a string", reducerOne: "reduceData"};
    expect(window["computeTestValue1"]).to.deep.equal(testValue);
  });

  it("two computes", function () {
    const computeOne = function (a, testOne) {
      return a + testOne;
    };

    const computeTwo = function (_computeOne, a) {
      return _computeOne + "|" + a;
    };

    state.bindCompute("_computeOne", computeOne, ["a", "reducerOne"]);
    state.bindCompute("_computeTwo", computeTwo, ["_computeOne", "a"]);

    let testValue = {
      a: "a string",
      reducerOne: "reduceData2",
      _computeOne: "a stringreduceData2",
      _computeTwo: "a stringreduceData2|a string"
    };

    fireAndSetGlobalVariable(reducerEventName, "reduceData2", "computeTestValue1");
    expect(window["computeTestValue1"]).to.deep.equal(testValue);
  });

  it("observer", function () {
    const observeOne = function (prop) {
      window.computeTwoTestValue = prop;
    };
    state.bindObserve(observeOne, ["_computeTwo"]);
    let testValue = {
      a: "a string",
      reducerOne: "reduceData",
      _computeOne: "a stringreduceData",
      _computeTwo: "a stringreduceData|a string"
    };

    fireAndSetGlobalVariable(reducerEventName, "reduceData", "computeTestValue1");
    expect(window.computeTwoTestValue).to.be.equal("a stringreduceData|a string");
    expect(window["computeTestValue1"]).to.deep.equal(testValue);
  });
});