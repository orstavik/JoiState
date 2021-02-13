import {JoiStore, JoiGraph} from "../../src/JoiStore.js";
import {JoiHistory} from "../../src/JoiHistory.js";

describe('JoiHistory', function () {

  it("double run", function () {
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
    let notInTestFirstTime = [
      "",
      "task",
      "task.reducer",
      "task.start",
      "task.stop",
      "task.timestamp",
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
      "task.timestamp",
      "startState",
      "startState._computeOne",
      "startState.reducerOne",
      "reducedState",
      "reducedState._computeOne",
      "computerInfo",
      "computerInfo._computeOne = computeOne(a, reducerOne)",
      "computerInfo._computeOne = computeOne(a, reducerOne).func",
      "observerInfo",
      "observerInfo.undefined = observeOne(_computeTwo)",
      "observerInfo.undefined = observeOne(_computeTwo).func"
    ];

    const reducerOne = function (state, e) {
      state.reducerOne = e;
    };
    const computeOne = function (a, testOne) {
      return a + testOne;
    };
    const observeOne = function (prop) {
      console.log(prop);
    };

    const state = new JoiStore({a: "a string"});
    state.compute(["a", "reducerOne"], "_computeOne", computeOne);
    state.observe(["_computeTwo"], observeOne);
    let firstTime = true;
    const history = new JoiHistory(state);
    history.bindOnChange(history => {
      if (firstTime) {
        expect(history.length).to.be.equal(1);
        let diff = Object.keys(JoiGraph.flatten(JoiGraph.filterDeep(history[0], testValue1)));
        expect(diff).to.deep.equal(notInTestFirstTime);
        firstTime = false;
      } else {
        expect(history.length).to.be.equal(2);
        let diff = Object.keys(JoiGraph.flatten(JoiGraph.filterDeep(history[1], testValue1)));
        expect(diff).to.deep.equal(notInTestSecondTime);
      }
    });
    state.dispatch(reducerOne, "reduceData");
    state.dispatch(reducerOne, "reduceData");
  });
});