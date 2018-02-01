describe('JoiState basics', function () {

  it("new JoiState", function () {
    const startState = {
      a: "a string"
    };
    const state = new JoiState(startState);
    expect(state.state).to.deep.equal({a: "a string"});
  });

  it(".bindReduce", function (done) {

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

  it(".bindCompute x2", function (done) {
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

  it(".bindObserve", function (done) {
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

  it(".bindObserve(func, ['']) - listen to changes on the entire state object", function (done) {
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "a", detail);
    };
    const onNewState = function (newState) {
      expect(newState).to.deep.equal({a: "hello"});
      state.destructor();
      done();
    };

    const state = new JoiState({a: "a string"});
    state.bindReduce('state-test-one', reducerOne, true);
    state.bindObserve(onNewState, [""]);
    window.dispatchEvent(new CustomEvent('state-test-one', {detail: "a string"})); //should not trigger observe on root
    window.dispatchEvent(new CustomEvent('state-test-one', {detail: "hello"}));    //should trigger observe on root
  });

  it(".bindCompute() - combining two parts of the state 1", function (done) {
    const startState = {
      users: {
        ab: "AB",
        ba: {
          name: "BA",
          address: "BA home"
        }
      },
    };
    const endState = Object.assign({}, startState);
    endState.user = "ab";
    endState._userName = "AB";

    const state = new JoiState(startState);
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "user", detail);
    };
    const computeOne = function (users, username) {
      return users[username];
    };
    state.bindReduce('state-test-two', reducerOne, true);
    state.bindCompute("_userName", computeOne, ["users", "user"]);
    state.onComplete = function (newState) {
      expect(newState).to.deep.equal(endState);
      state.destructor();
      done();
    };
    window.dispatchEvent(new CustomEvent('state-test-two', {composed: true, bubbles: true, detail: "ab"}));
  });

  it(".bindCompute() - combining two parts of the state 2", function (done) {
    const startState = {
      users: {
        ab: "AB",
        ba: {
          name: "BA",
          address: "BA home"
        }
      },
    };
    const endState = Object.assign({}, startState);
    endState.user = "ba";
    endState._userName = {
      name: "BA",
      address: "BA home"
    };

    const state = new JoiState(startState);
    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "user", detail);
    };
    const computeOne = function (users, username) {
      return users[username];
    };
    state.bindReduce('state-test-two', reducerOne, true);
    state.bindCompute("_userName", computeOne, ["users", "user"]);
    state.onComplete = function (newState) {
      expect(newState).to.deep.equal(endState);
      state.destructor();
      done();
    };
    window.dispatchEvent(new CustomEvent('state-test-two', {composed: true, bubbles: true, detail: "ba"}));
  });
});