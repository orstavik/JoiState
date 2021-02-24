import {JoiStore} from "../../src/v3/JoiStore.js";

describe('JoiStore basics', function () {

  it("new JoiStore", function () {
    const state = new JoiStore({hello: "sunshine"});
    expect(state.state).to.deep.equal({hello: "sunshine"});
  });

  it("JoiStore.reduce()", function () {
    const state = new JoiStore();
    state.reduce('hello', 'sunshine');
    expect(state.state).to.deep.equal({hello: "sunshine"});
  });

  it("JoiStore.compute()", function () {
    const state = new JoiStore();
    state.compute(['a'], function (a) {
      return a + 'B';
    }, 'b');
    state.reduce('a', 'A');
    expect(state.state).to.deep.equal({a: "A", b: 'AB'});
  });

  it("JoiStore.observe()", function () {
    const tstValues = [];
    const state = new JoiStore();
    state.observe(['hello'], function (val) {
      tstValues.push(val);
    });
    state.reduce('hello', 'sunshine');
    expect(state.state).to.deep.equal({hello: "sunshine", '_action_0': undefined});
    expect(tstValues).to.deep.equal(['sunshine']);
  });

  it('reduce, two computes and an observer', function(){
    const tst = [];
    const state = new JoiStore();
    state.compute(['a'], a => a + 'B', 'b');
    state.compute(['b'], b => b + 'C', 'c');
    state.observe(['c'], c => tst.push(c));
    state.reduce('a', 'A');
    expect(tst).to.deep.equal(['ABC']);
  });
});

describe('JoiStore redundancy', function () {

  it(".reduce() - ignore if no changes", function () {
    const state = new JoiStore();
    state.reduce('hello', {val: 'sunshine'});
    const rememberMe = state.state;
    state.reduce('hello', {val: 'sunshine'});
    assert(state.state === rememberMe);
  });

  it(".reduce() - reuse partial inputs", function () {
    const state = new JoiStore();
    state.reduce('hello', {outer: {inner: 'sunshine'}});
    expect(state.state).to.deep.equal({hello: {outer: {inner: 'sunshine'}}});
    const rememberOut = state.state.hello;
    const rememberInner = state.state.hello.outer;
    state.reduce('hello', {outer: {inner: 'sunshine'}, difference: 1});
    expect(state.state).to.deep.equal({hello: {outer: {inner: 'sunshine'}, difference: 1}});
    assert(state.state.hello !== rememberOut);
    assert(state.state.hello.outer === rememberInner);
  });

  it(".reduce() - reuse with NaN", function () {
    const state = new JoiStore();
    state.reduce('hello', {outer: {inner: NaN}});
    expect(state.state).to.deep.equal({hello: {outer: {inner: NaN}}});
    const rememberOut = state.state.hello;
    const rememberInner = state.state.hello.outer;
    state.reduce('hello', {outer: {inner: NaN}, difference: 1});
    expect(state.state).to.deep.equal({hello: {outer: {inner: NaN}, difference: 1}});
    assert(state.state.hello !== rememberOut);
    assert(state.state.hello.outer !== rememberInner);
  });

  it(".compute() - second compute on the same prop looses the race", function () {
    const state = new JoiStore();
    state.compute(['hello'], function () {
      return 'sunshine';
    }, 'goodbye');
    state.compute(['hello'], function () {
      return 'darkness';
    }, 'goodbye');
    state.reduce('hello', 'sunshine');
    expect(state.state).to.deep.equal({hello: "sunshine", goodbye: 'sunshine'});
  });

  //todo how do i compute/observe the whole state object? It is definitively a useful case.

  // it(".bindObserve(func, ['']) - listen to changes on the entire state object", function () {
  //   function reducerOne(state, e) {
  //     state.a = e;
  //   }
  //
  //   const onNewState = function (newState) {
  //     expect(newState).to.deep.equal({a: "hello"});
  //   };
  //   const state = new JoiStore({a: "a string"});
  //   state.observe([""], onNewState);
  //   state.dispatch(reducerOne, "a string");                                    //should not trigger observe on root
  //   Promise.resolve().then(()=> state.dispatch(reducerOne, "hello"));          //should trigger observe on root
  // });
  //
  // it(".bindCompute() - combining two parts of the state 1", function () {
  //   const startState = {
  //     users: {
  //       ab: "AB",
  //       ba: {
  //         name: "BA",
  //         address: "BA home"
  //       }
  //     },
  //   };
  //   const endState = Object.assign({user: "ab", _userName: "AB"}, startState);
  //
  //   function reducerOne(state, e) {
  //     state.user = e;
  //   }
  //
  //   const computeOne = function (users, username) {
  //     return users[username];
  //   };
  //
  //   const state = new JoiStore(startState);
  //   state.compute(["users", "user"], "_userName", computeOne);
  //   state.onComplete(newState => expect(newState).to.deep.equal(endState));
  //   state.dispatch(reducerOne, "ab");
  // });
  //
  // it(".bindCompute() - combining two parts of the state 2", function () {
  //   const startState = {
  //     users: {
  //       ab: "AB",
  //       ba: {
  //         name: "BA",
  //         address: "BA home"
  //       }
  //     },
  //   };
  //   const endState = Object.assign({user: "ba", _userName: {name: "BA", address: "BA home"}}, startState);
  //
  //   function reducerOne(state, e) {
  //     state.user = e;
  //   }
  //
  //   const computeOne = function (users, username) {
  //     return users[username];
  //   };
  //
  //   const state = new JoiStore(startState);
  //   state.compute(["users", "user"], "_userName", computeOne);
  //   state.onComplete(newState => expect(newState).to.deep.equal(endState));
  //   state.dispatch(reducerOne, "ba");
  // });
  //
  //todo this is tested in the reducer, but to test this for computers, we need to implement the caching syntax
  //
  // it("NaN !== NaN. Values changing from NaN to NaN is not considered a change in JoiCompute", function () {
  //   function reducerOne(state, e) {
  //     state.a = e;
  //   }
  //
  //   const sum = function (a, b) {
  //     return a + b;  //returns NaN when a or b is not a number
  //   };
  //   const state = new JoiStore({a: 1});
  //   state.compute(["a", "_c"], "_b", sum);
  //   state.compute(["a", "_b"], "_c", sum);
  //   state.onComplete(newState => {
  //     expect(newState.a).to.be.equal(2);
  //     expect(newState._b).to.be.NaN;
  //     expect(newState._c).to.be.NaN;
  //   });
  //   state.dispatch(reducerOne, 2);
  // });
  //
  //todo the below test I don't think should apply anymore. It is no longer possible to run loops like this.

  // it("confusable computers / observers paths", function () {
  //   const startState = {
  //     a: {
  //       b: 2
  //     },
  //     b: {
  //       c: 9
  //     },
  //     c: 1
  //   };
  //   const state = new JoiStore(startState);
  //
  //   function reducerOne(state, e) {
  //     state.user = e;
  //   }
  //
  //   const computeOne = function (a, b) {
  //     return JSON.stringify(a) + JSON.stringify(b);
  //   };
  //   let counter = 0;
  //   const observeOne = function (a, b) {
  //     window["whatever_" + counter++] = JSON.stringify(a) + JSON.stringify(b);
  //   };
  //   state.compute(["a.b", "c"], "_d1", computeOne);
  //   state.compute(["a", "b.c"], "_d2", computeOne);   // same computer function, different paths and return value
  //   state.compute(["a", "b.c"], "_d3", computeOne);   // same computer function, different return value only
  //   state.compute(["a.b", "c"], "_d4", computeOne);
  //   debugger
  //   state.compute(["a", "b.c"], "_d4", computeOne);   // two computer functions writing to the same path, only the last should be active.
  //   state.observe(["a.b", "c"], observeOne);
  //   state.observe(["a", "b.c"], observeOne);          // same observer function, different paths
  //   state.observe(["a", "b.c"], computeOne);          // should not throw any Errors
  //
  //   const testValue = Object.assign({}, startState);
  //   testValue.user = "JohnSmith";
  //   testValue._d1 = "21";
  //   testValue._d2 = '{"b":2}9';
  //   testValue._d3 = '{"b":2}9';
  //   testValue._d4 = '{"b":2}9';
  //   state.onComplete(newState => {
  //     expect(newState).to.deep.equal(testValue);
  //     expect(window.whatever_0).to.be.equal("21");
  //     expect(window.whatever_1).to.be.equal('{"b":2}9');
  //   });
  //   state.dispatch(reducerOne, "JohnSmith");
  // });
});