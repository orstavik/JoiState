import {JoiStore} from "../../src/v3/JoiStore.js";

describe('?mutation', function () {

  it("?mutation with error", function () {

    const declarations = {
      test1: function (a) {
        a.mutate = true;
        return a;
      },
      test2: function (a) {
        const res = Object.assign({}, a);
        res.mutate = false;
        return res;
      }
    }
    const actions = [
      [['a'], '?test1', ['mutate']],
      // [['a'], '?test2', ['immutate']]
    ];
    const state = new JoiStore({}, actions, declarations);
    state.reduce('a', {hello: "sunshine"});
    expect(state.state).to.deep.equals({
      a: {hello: "sunshine", mutate: true},
      mutate: {hello: "sunshine", mutate: true},
      _mutation_check_0_1: '[{"hello":"sunshine"}]',
      _mutation_error_0: {before: '[{"hello":"sunshine"}]', after: '[{"hello":"sunshine","mutate":true}]'}
    });
  });
  
  it("?mutation without error", function () {

    const declarations = {
      test1: function (a) {
        a.mutate = true;
        return a;
      },
      test2: function (a) {
        const res = Object.assign({}, a);
        res.mutate = false;
        return res;
      }
    }
    const actions = [
      // [['a'], '?test1', ['mutate']],
      [['a'], '?test2', ['immutate']]
    ];
    const state = new JoiStore({}, actions, declarations);
    state.reduce('a', {hello: "sunshine"});
    expect(state.state).to.deep.equals({
      a: {hello: "sunshine"},
      immutate: {hello: "sunshine", mutate: false},
      _mutation_check_0_1: '[{"hello":"sunshine"}]',
      _mutation_check_0_2: '[{"hello":"sunshine"}]'
    });
  });

});