import {JoiStore} from "../../src/JoiStore.js";

describe('JoiStore Errors', function () {

  it("JoiStore simple error", function () {
    const reducerFail = function () {
      throw new Error("i should fail");
    };
    const state = new JoiStore();
    state.onError = function (error) {
      expect("Error: i should fail").to.be.equal(error.toString());
    };
    state.dispatch(reducerFail);
  });

  it("JoiStore still works after error", function () {
    const reducerOne = function (state, e) {
      state.a = e;
    };
    const reducerFail = function () {
      throw new Error("i should fail");
    };
    const state = new JoiStore({a: 1});
    state.onError = function (error) {
      expect("Error: i should fail").to.be.equal(error.toString());
    };
    let firstTime = true;
    state.onComplete (newState => {
      if (firstTime) {
        expect(newState.a).to.be.equal(1);
        firstTime = false;
      } else {
        expect(newState.a).to.be.equal(3);
      }
    });
    state.dispatch(reducerFail, null);
    Promise.resolve().then(()=> state.dispatch(reducerOne, 3));
  });

//todo this loop should never happen
  //todo when you add a computer like this, it should throw an error 'add time'.
//   it("make sure an infinite loop happens", function () {
//     const expectedErrorMsg =
// `JoiStateStackOverflowError: Infinite loop or too complex computes in JoiStore.
// [_c = sum(a, _b)]
// [_b = sum(a, _c)]
// [_c = sum(a, _b)]
// [_b = sum(a, _c)]
// [_c = sum(a, _b)]
// [_b = sum(a, _c)]
// [_c = sum(a, _b)]
// [_b = sum(a, _c)]
// [_c = sum(a, _b)]
// [_b = sum(a, _c)]`;
//     const reducerOne = function (state, detail) {
//       state.a = detail;
//     };
//     const sum = function (a, b) {
//       return (a || 0) + (b || 0);
//     };
//     const state = new JoiStore({a: 1});
//     //todo this shouldn't be allowed. If you don't have all the arguments, then you cannot run.
//     state.compute(["a", "_c"], "_b", sum);   //infinite loop, when _b is updated,
//     //todo here, when we add a computer, then the computer will start to run.
//     // It might be better to have the computers only run when a new state change is triggered.
//     try{
//       state.compute(["a", "_b"], "_c", sum);   // _c will need to be recalculated, and that triggers update of _b again
//     } catch (error) {
//       //todo here we should expect just a state === {a: 1}
//       expect(expectedErrorMsg).to.be.equal(error.toString());
//     }
//   });
});