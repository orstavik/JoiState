import {JoiStore} from "../../src/v2/JoiStore.js";

describe('JoiStore async', function () {

  it('reduce, two computes and an observer', function () {
    const tst = [];
    const state = new JoiStore();
    state.compute(['a'], a => a + 'B', 'b');
    state.compute(['b'], b => b + 'C', 'c');
    state.observe(['c'], c => tst.push(c));
    state.reduce('a', 'A');
    expect(tst).to.deep.equal(['ABC']);
  });
});

