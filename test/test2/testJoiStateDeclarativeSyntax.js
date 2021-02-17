import {JoiStore} from "../../src/v2/JoiStore.js";

describe('JoiStore Declarative syntax', function () {

  it('Declarative: two computes and an observer', function(){
    const tst = [];

    const functions ={
      funAB: a => a + 'B',
      funBC: b => b + 'C',
      funC: c=>tst.push(c)
    };

    const actions = [
      [['a'], 'funAB', 'b'],
      [['b'], 'funBC', 'c'],
      [['c'], 'funC']
    ];
    const state = new JoiStore({}, actions, functions);
    state.reduce('a', 'A');
    expect(tst).to.deep.equal(['ABC']);
  });
});
