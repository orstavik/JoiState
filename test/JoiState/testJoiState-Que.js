function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('JoiState.que', function () {

  const reducerOne = function (state, detail) {
    let res = 0;
    for (let i = 0; i < detail; i++)
      res++;
    return JoiGraph.setIn(state, "a", res);
  };
  const startState = {
    a: "a string"
  };
  const state = new JoiState(startState);

  it("reducer", function () {

    state.bindReduce('state-que-one', reducerOne, false);

    //thread 1
    (async function () {
      await sleep(0);
      for (let i = 0; i < 100; i++) {
        window.dispatchEvent(new CustomEvent('state-que-one', {bubbles: true, composed: true, detail: 123456}));
      }
      console.log("a");
    })();

    //thread 2
    (async function () {
      await sleep(0);
      for (let i = 0; i < 100; i++) {
        window.dispatchEvent(new CustomEvent('state-que-one', {bubbles: true, composed: true, detail: 123456}));
      }
      console.log("b");
    })();

    (async function () {
      await sleep(0);
      expect(state.state).to.deep.equal({a: 123456});
      console.log("C");
    })();
  });

});

