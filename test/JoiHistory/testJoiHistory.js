describe('JoiHistory', function () {

  it("double run", function (done) {
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
    let notInTestFirstTime = [
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
    let notInTestSecondTime = [
      "",
      "task",
      "task.reducer",
      "task.start",
      "task.stop",
      "task.timeOrigin",
      "startState",
      "startState.reducerOne",
      "startState._computeOne",
      "reducedState",
      "reducedState._computeOne",
      "computerInfo",
      "computerInfo._computeOne = computeOne(a, reducerOne)",
      "computerInfo._computeOne = computeOne(a, reducerOne).func",
      "observerInfo",
      "observerInfo.undefined = observeOne(_computeTwo)",
      "observerInfo.undefined = observeOne(_computeTwo).func"
    ];

    const reducerOne = function (state, detail) {
      return JoiGraph.setIn(state, "reducerOne", detail);
    };
    const computeOne = function (a, testOne) {
      return a + testOne;
    };
    const observeOne = function (prop) {
      console.log(prop);
    };

    const state = new JoiStateWithFullHistory({a: "a string"});
    state.bindReduce('history-test-one', reducerOne, true);
    state.bindCompute("_computeOne", computeOne, ["a", "reducerOne"]);
    state.bindObserve(observeOne, ["_computeTwo"]);
    let firstTime = true;
    state.onHistoryChanged = history => {
      if (firstTime) {
        expect(history.length).to.be.equal(1);
        let diff = Object.keys(JoiGraph.flatten(JoiGraph.filterDeep(history[0], testValue1)));
        expect(diff).to.deep.equal(notInTestFirstTime);
        firstTime = false;
      } else {
        expect(history.length).to.be.equal(2);
        let diff = Object.keys(JoiGraph.flatten(JoiGraph.filterDeep(history[1], testValue1)));
        expect(diff).to.deep.equal(notInTestSecondTime);
        state.destructor();
        done();
      }
    };
    window.dispatchEvent(new CustomEvent('history-test-one', {detail: "reduceData"}));
    window.dispatchEvent(new CustomEvent('history-test-one', {detail: "reduceData"}));

    // const result = fireAndSetGlobalVariable('history-test-one', "reduceData", "state-history-changed");
    // const history = window[result];
    // expect(history.length).to.be.equal(1);
    // let diff = Object.keys(JoiGraph.flatten(JoiGraph.filterDeep(history[0], testValue1[0])));
    // expect(diff).to.deep.equal(notInTest);
  });
});