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
    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "reducerOne", e.detail);
    };
    const state = new JoiState(startState);
    state.bindReduce('state-test-one', reducerOne, true);
    state.bindOnComplete(
      newState => {
        expect(newState).to.deep.equal(testValue);
        state.destructor();
        done();
      }
    );
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
    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "reducerOne", e.detail);
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
    state.bindOnComplete (newState => {
      expect(newState).to.deep.equal(testValue);
      state.destructor();
      done();
    });
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
    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "reducerOne", e.detail);
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
    state.bindOnComplete(newState => {
      expect(newState).to.deep.equal(testValue);
      expect(window.computeTwoTestValue).to.be.equal("a stringreduceData|a string");
      state.destructor();
      done();
    });
    window.dispatchEvent(new CustomEvent('state-test-three', {bubbles: true, composed: true, detail: "reduceData"}));
  });

  it(".bindObserve(func, ['']) - listen to changes on the entire state object", function (done) {
    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "a", e.detail);
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
    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "user", e.detail);
    };
    const computeOne = function (users, username) {
      return users[username];
    };
    state.bindReduce('state-test-two', reducerOne, true);
    state.bindCompute("_userName", computeOne, ["users", "user"]);
    state.bindOnComplete (function (newState) {
      expect(newState).to.deep.equal(endState);
      state.destructor();
      done();
    });
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
    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "user", e.detail);
    };
    const computeOne = function (users, username) {
      return users[username];
    };
    state.bindReduce('state-test-two', reducerOne, true);
    state.bindCompute("_userName", computeOne, ["users", "user"]);
    state.bindOnComplete (function (newState) {
      expect(newState).to.deep.equal(endState);
      state.destructor();
      done();
    });
    window.dispatchEvent(new CustomEvent('state-test-two', {composed: true, bubbles: true, detail: "ba"}));
  });

  it("NaN !== NaN. Values changing from NaN to NaN is not considered a change in JoiCompute", function (done) {
    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "a", e.detail);
    };
    const sum = function (a, b) {
      return a + b;  //returns NaN when a or b is not a number
    };
    const state = new JoiState({a: 1});
    state.bindReduce('state-test-nan', reducerOne, true);
    state.bindCompute("_b", sum, ["a", "_c"]);
    state.bindCompute("_c", sum, ["a", "_b"]);
    state.bindOnComplete (newState => {
      expect(newState.a).to.be.equal(2);
      expect(newState._b).to.be.NaN;
      expect(newState._c).to.be.NaN;
      state.destructor();
      done();
    });
    window.dispatchEvent(new CustomEvent('state-test-nan', {bubbles: true, composed: true, detail: 2}));
  });

  it("confusable computers / observers paths", function (done) {
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

    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "user", e.detail);
    };
    const computeOne = function (a, b) {
      return JSON.stringify(a) + JSON.stringify(b);
    };
    let counter = 0;
    const observeOne = function (a, b) {
      window["whatever_" + counter++] = JSON.stringify(a) + JSON.stringify(b);
    };
    state.bindReduce('state-test-three', reducerOne, true);
    state.bindCompute("_d1", computeOne, ["a.b", "c"]);
    state.bindCompute("_d2", computeOne, ["a", "b.c"]);   // same computer function, different paths and return value
    state.bindCompute("_d3", computeOne, ["a", "b.c"]);   // same computer function, different return value only
    state.bindCompute("_d4", computeOne, ["a.b", "c"]);
    state.bindCompute("_d4", computeOne, ["a", "b.c"]);   // two computer functions writing to the same path, only the last should be active.
    state.bindObserve(observeOne, ["a.b", "c"]);
    state.bindObserve(observeOne, ["a", "b.c"]);          // same observer function, different paths
    state.bindObserve(computeOne, ["a", "b.c"]);          // should not throw any Errors

    const testValue = Object.assign({}, startState);
    testValue.user = "JohnSmith";
    testValue._d1 = "21";
    testValue._d2 = '{"b":2}9';
    testValue._d3 = '{"b":2}9';
    testValue._d4 = '{"b":2}9';
    state.bindOnComplete (newState => {
      expect(newState).to.deep.equal(testValue);
      expect(window.whatever_0).to.be.equal("21");
      expect(window.whatever_1).to.be.equal('{"b":2}9');
      state.destructor();
      done();
    });
    window.dispatchEvent(new CustomEvent('state-test-three', {bubbles: true, composed: true, detail: "JohnSmith"}));
  });
});