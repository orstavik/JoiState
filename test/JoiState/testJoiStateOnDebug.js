import {JoiStore, JoiGraph} from "../../src/JoiStore.js";

describe('JoiStore.onDebug', function () {

  it("test first run", function () {

    const reducerOne = function (state, e) {
      return JoiGraph.setIn(state, "reducerOne", e);
    };
    const computeOne = function (a, testOne) {
      return a + testOne;
    };
    const observeOne = function (prop) {
      console.log(prop);
    };
    let testValue1 = {
      startState: {
        a: "a string",
        _computeOne: "a stringundefined"
      },
      reducedState: {
        a: "a string",
        reducerOne: "reduceData",
        _computeOne: "a stringundefined"
      },
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
        data: "reduceData",
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
      "computerInfo",
      "computerInfo._computeOne = computeOne(a, reducerOne)",
      "computerInfo._computeOne = computeOne(a, reducerOne).func",
      "observerInfo",
      "observerInfo.undefined = observeOne(_computeTwo)",
      "observerInfo.undefined = observeOne(_computeTwo).func"
    ];

    const state = new JoiStore({a: "a string"});
    state.compute(["a", "reducerOne"], "_computeOne", computeOne);
    state.observe(["_computeTwo"], observeOne);
    state.onComplete((newState, task, startState, reducedState, computer, observer, error) => {
      task.taskName = task.reducer.name;
      const debugInfo = {
        task,
        startState,
        reducedState,
        newState,
        computerInfo: computer.functionsRegister,
        observerInfo: observer.functionsRegister,
        error
      };
      let diff = Object.keys(JoiGraph.flatten(JoiGraph.filterDeep(debugInfo, testValue1)));
      expect(diff).to.deep.equal(diffInTest);
    });
    state.dispatch(reducerOne, "reduceData");
  });
});