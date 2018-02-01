describe('JoiState.onDebug', function () {

  it("test first run", function (done) {

    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "reducerOne", detail);
    };
    const computeOne = function (a, testOne) {
      return a + testOne;
    };
    const observeOne = function (prop) {
      console.log(prop);
    };
    const _simplifyTask = function (task) {
      task.stop = performance.now();
      task.timeOrigin = performance.timeOrigin;
      task.event = {type: task.event.type, detail: task.event.detail};
      task.taskName = task.reducer.name;
      return task;
    };

    let testValue1 = {
      startState: {a: "a string"},
      reducedState: {a: "a string", reducerOne: "reduceData"},
      computedState: {
        a: "a string",
        reducerOne: "reduceData",
        _computeOne: "a stringreduceData"
      },
      newState: {
        a: "a string",
        reducerOne: "reduceData",
        _computeOne: "a stringreduceData"
      },
      task: {
        event: {type: "history-test-one", detail: "reduceData"},
        taskName: "reducerOne",
      },
      computerInfo: {
        "_computeOne = computeOne(a, reducerOne)": {
          funKy: "_computeOne = computeOne(a, reducerOne)",
          funcName: "computeOne",
          argsPaths: ["a", "reducerOne"],
          returnPath: "_computeOne"
        }
      },
      observerInfo: {
        "undefined = observeOne(_computeTwo)": {
          funKy: "undefined = observeOne(_computeTwo)",
          funcName: "observeOne",
          argsPaths: ["_computeTwo"]
        }
      }
    };
    let diffInTest = [
      "",
      "task",
      "task.reducer",
      "task.start",
      "task.stop",
      "task.timeOrigin",
      "computerInfo",
      "computerInfo._computeOne = computeOne(a, reducerOne)",
      "computerInfo._computeOne = computeOne(a, reducerOne).func",
      "observerInfo",
      "observerInfo.undefined = observeOne(_computeTwo)",
      "observerInfo.undefined = observeOne(_computeTwo).func"
    ];

    const state = new JoiState({a: "a string"});
    state.bindReduce('history-test-one', reducerOne, true);
    state.bindCompute("_computeOne", computeOne, ["a", "reducerOne"]);
    state.bindObserve(observeOne, ["_computeTwo"]);
    state.onComplete = (newState, task, startState, reducedState, computer, observer, error) => {
      const debugInfo = {
        task: _simplifyTask(task),
        startState,
        reducedState,
        newState,
        computerInfo: computer.functionsRegister,
        observerInfo: observer.functionsRegister,
        error
      };
      let diff = Object.keys(JoiGraph.flatten(JoiGraph.filterDeep(debugInfo, testValue1)));
      expect(diff).to.deep.equal(diffInTest);
      state.destructor();
      done();
    };
    window.dispatchEvent(new CustomEvent('history-test-one', {detail: "reduceData"}));
  });

});