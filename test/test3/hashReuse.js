import {JoiStore} from "../../src/v3/JoiStore.js";

describe('#reuse', function () {

  it("#reuse", function () {

    const declarations = {
      test: function (a) {
        return JSON.parse(a);
      }
    }
    const actions = [
      [['a'], '#test', ['b']]
    ];

    const state = new JoiStore({}, actions, declarations);
    state.reduce('a', '{"hello":"sunshine","obj":{"abc":123}}');
    const state1 = state.state;
    expect(state.state).to.deep.equals({
      a: '{"hello":"sunshine","obj":{"abc":123}}',
      _reuse_0_b: {hello: 'sunshine', obj: {abc: 123}},
      b: {hello: 'sunshine', obj: {abc: 123}}
    });

    state.reduce('a', '{"hello":"world","obj":{"abc":123}}');
    const state2 = state.state;
    expect(state.state).to.deep.equals({
      a: '{"hello":"world","obj":{"abc":123}}',
      _reuse_0_b: {hello: 'world', obj: {abc: 123}},
      b: {hello: 'world', obj: {abc: 123}}
    });
    assert(state2 !== state1);
    assert(state2.b !== state1.b);
    assert(state2.b.hello !== state1.b.hello);
    assert(state2.b.obj === state1.b.obj);
    assert(state1._reuse_0_b.obj === state1.b.obj);
    assert(state2._reuse_0_b.obj !== state2.b.obj);
  });
});