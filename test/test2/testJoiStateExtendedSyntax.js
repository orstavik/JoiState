import {JoiStore} from "../../src/v2/JoiStore.js";

describe('JoiStore Extended syntax', function () {

  it('Reuse (#): computer output is reusing as much as possible', function () {

    const functions = {
      funReuse: a => ({hello: {sunshine: 'is the same'}, num: Math.random()}),
    };

    const actions = [
      [['a'], '#funReuse', 'b']
    ];
    const state = new JoiStore({}, actions, functions);
    state.reduce('a', 'A1');
    const state1 = state.state;
    const num1 = state.state.num;
    const hello1 = state.state.hello;
    expect(state.state).to.deep.equal({a: 'A1', hello: {sunshine: 'is the same'}, num: num1});
    state.reduce('a', 'A2');
    const state2 = state.state;
    const num2 = state.state.num;
    const hello2 = state.state.hello;
    expect(state.state).to.deep.equal({a: 'A2', hello: {sunshine: 'is the same'}, num: num2});
    assert(num1!== num2);
    assert(hello1 === hello2);
    assert(state1 !== state2);
  });
});
