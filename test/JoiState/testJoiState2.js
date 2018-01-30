describe('test 2 of JoiState', function () {

  it("add username and compute a child", function (done) {
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
    state.bindOnEnd(function (newState) {
      expect(newState).to.deep.equal(endState);
      state.destructor();
      done();
    });
    window.dispatchEvent(new CustomEvent('state-test-two', {composed:true, bubbles:true, detail:"ab"}));
  });

  it("add username and compute a child that is complex", function (done) {
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
    state.bindOnEnd(function (newState) {
      expect(newState).to.deep.equal(endState);
      state.destructor();
      done();
    });
    window.dispatchEvent(new CustomEvent('state-test-two', {composed:true, bubbles:true, detail:"ba"}));
  });
});

