import {JoiStore} from "../../src/v3/JoiStore.js";

describe('builtins', function () {

  it("equals", function () {

    const actions = [
      [['something', '*a', '*b', '*c'], 'equals', ['ifa', 'ifb', 'ifc', 'else']]
    ];

    const state = new JoiStore({something: 'one'}, actions, {});
    state.reduce('something', 'bob');
    expect(state.state).to.deep.equals({
      something: 'bob',
      else: 'bob'
    });
    state.reduce('a', 'bob');
    expect(state.state).to.deep.equals({
      something: 'bob',
      a: 'bob',
      ifa: 'bob',
    });
    state.reduce('b', 'bob');
    expect(state.state).to.deep.equals({
      something: 'bob',
      a: 'bob',
      b: 'bob',
      ifa: 'bob',
      ifb: 'bob',
    });
    state.reduce('c', 'bob');
    expect(state.state).to.deep.equals({
      something: 'bob',
      a: 'bob',
      b: 'bob',
      c: 'bob',
      ifa: 'bob',
      ifb: 'bob',
      ifc: 'bob',
    });
  });
});