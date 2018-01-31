describe('test of JoiState', function () {

  it("new JoiState", function () {
    const startState = {
      a: "a string"
    };
    const state = new JoiState(startState);
    expect(state.state).to.deep.equal({a: "a string"});
  });

  it("reducer", function (done) {

    const testValue = {a: "a string", reducerOne: "reduceData"};
    const startState = {
      a: "a string"
    };
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "reducerOne", detail);
    };
    const state = new JoiState(startState);
    state.bindReduce('state-test-one', reducerOne, true);
    state.onComplete = newState => {
      expect(newState).to.deep.equal(testValue);
      state.destructor();
      done();
    };
    window.dispatchEvent(new CustomEvent('state-test-one', {bubbles: true, composed: true, detail: "reduceData"}));
  });

  it("two computes", function (done) {
    let testValue = {
      a: "a string",
      reducerOne: "reduceData2",
      _computeOne: "a stringreduceData2",
      _computeTwo: "a stringreduceData2|a string"
    };
    const startState = {
      a: "a string"
    };
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "reducerOne", detail);
    };
    const computeOne = function (a, testOne) {
      return a + testOne;
    };

    const computeTwo = function (_computeOne, a) {
      return _computeOne + "|" + a;
    };

    const state = new JoiState(startState);
    state.bindReduce('state-test-two', reducerOne, true);
    state.bindCompute("_computeOne", computeOne, ["a", "reducerOne"]);
    state.bindCompute("_computeTwo", computeTwo, ["_computeOne", "a"]);
    state.onComplete = newState => {
      expect(newState).to.deep.equal(testValue);
      state.destructor();
      done();
    };
    window.dispatchEvent(new CustomEvent('state-test-two', {bubbles: true, composed: true, detail: "reduceData2"}));
  });

  it("observer", function (done) {
    let testValue = {
      a: "a string",
      reducerOne: "reduceData",
      _computeOne: "a stringreduceData",
      _computeTwo: "a stringreduceData|a string"
    };
    const startState = {
      a: "a string"
    };
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "reducerOne", detail);
    };
    const computeOne = function (a, testOne) {
      return a + testOne;
    };
    const computeTwo = function (_computeOne, a) {
      return _computeOne + "|" + a;
    };
    const observeOne = function (prop) {
      window.computeTwoTestValue = prop;
    };

    const state = new JoiState(startState);
    state.bindReduce('state-test-three', reducerOne, true);
    state.bindCompute("_computeOne", computeOne, ["a", "reducerOne"]);
    state.bindCompute("_computeTwo", computeTwo, ["_computeOne", "a"]);
    state.bindObserve(observeOne, ["_computeTwo"]);
    state.onComplete = newState => {
      expect(newState).to.deep.equal(testValue);
      expect(window.computeTwoTestValue).to.be.equal("a stringreduceData|a string");
      state.destructor();
      done();
    };
    window.dispatchEvent(new CustomEvent('state-test-three', {bubbles: true, composed: true, detail: "reduceData"}));
  });
});