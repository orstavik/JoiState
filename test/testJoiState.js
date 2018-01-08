describe('test of JoiState', function () {

  it("testing simple State functions", function () {

    window.addEventListener("state-changed", function (ev) {
      expect(ev.detail).to.deep.equal({a: "a string", reducerOne: "reduceData", _computeOne: "a stringreduceData"});
    });

    const initialState = {
      a: "a string"
    };

    let state = new JoiState(initialState);
    state.bindReduce('state-test-one', TestFunctions.reducerOne, true);
    state.bindCompute("_computeOne", TestFunctions.computeOne, ["a", "reducerOne"]);
    state.bindObserve(TestFunctions.observeOne, ["_computeOne"]);

    expect(initialState).to.deep.equal({a: "a string"});

    // console.log(initialState);
    window.dispatchEvent(new CustomEvent("state-test-one", {
      bubbles: true,
      composed: true,
      detail: "reduceData"
    }));

  });
});