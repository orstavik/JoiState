import {JoiStore} from "../../src/JoiStore.js";

describe('ReducerLoopError', function () {

  it("Observer dispatching reducer sync.", function () {

    const reducerOne = function (state, e) {
      state.a = e;
    };
    const reducerTwo = function (state, e) {
      state.b = e;
    };
    const observeOne = function (a) {
      state.dispatch(reducerOne, "B");
    };
    const observeTwo = function (a) {
      state.dispatch(reducerTwo, "C")
    };
    const state = new JoiStore();
    state.observe(["a"], observeOne);
    state.observe(["a"], observeTwo);

    try{
      state.dispatch(reducerOne, "A");
    } catch(err){
      expect(err.message).to.deep.equal('ReducerLoopError');
    }
  });
});