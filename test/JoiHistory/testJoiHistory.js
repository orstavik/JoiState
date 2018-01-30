describe('test of JoiHistory', function () {

  const reducerOne = function (state, detail) {
    return JoiGraph.setIn(state, "reducerOne", detail);
  };
  const computeOne = function (a, testOne) {
    return a + testOne;
  };
  const observeOne = function (prop) {
    console.log(prop);
  };

  const startState = {
    a: "a string"
  };
  const state = new JoiState(startState);
  const history = new JoiHistory(state);
  state.bindReduce('history-test-one', reducerOne, true);
  state.bindCompute("_computeOne", computeOne, ["a", "reducerOne"]);
  state.bindObserve(observeOne, ["_computeTwo"]);

  it("test first run", function () {
    let testValue1 = [
      {
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
        },
        que: []
      }
    ];
    let notInTest = [
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

    const result = fireAndSetGlobalVariable('history-test-one', "reduceData", "state-history-changed");
    const history = window[result];
    expect(history.length).to.be.equal(1);
    let diff = Object.keys(JoiGraph.flatten(JoiGraph.filterDeep(history[0], testValue1[0])));
    expect(diff).to.deep.equal(notInTest);
  });
});