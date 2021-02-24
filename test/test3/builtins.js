import {JoiStore} from "../../src/v3/JoiStore.js";

describe('builtins', function () {

  it("equals", function () {

    const actions = [
         //test      //1   //2   //3                //1     //2     //3
      [['something', '*a', '*b', '*c'], 'equals', ['if_a', 'if_b', 'if_c', 'else']]
    ];

    const state = new JoiStore({}, actions, {});

    state.reduce('something', 'bob');
    expect(state.state).to.deep.equals({
      something: 'bob',
      else: 'bob'
    });
    state.reduce('a', 'bob');
    expect(state.state).to.deep.equals({
      something: 'bob',
      a: 'bob',
      if_a: 'bob',
    });
    state.reduce('b', 'bob');
    expect(state.state).to.deep.equals({
      something: 'bob',
      a: 'bob',
      b: 'bob',
      if_a: 'bob',
      if_b: 'bob',
    });
    state.reduce('c', 'bob');
    expect(state.state).to.deep.equals({
      something: 'bob',
      a: 'bob',
      b: 'bob',
      c: 'bob',
      if_a: 'bob',
      if_b: 'bob',
      if_c: 'bob',
    });
    state.reduce('b', 'alice');
    expect(state.state).to.deep.equals({
      something: 'bob',
      a: 'bob',
      b: 'alice',
      c: 'bob',
      if_a: 'bob',
      if_c: 'bob',
    });
  });
});