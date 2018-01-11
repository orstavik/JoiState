describe('test of JoiState', function () {

  const state = new JoiState(
    {
      a: "a string"
    }
  );

  it("new JoiState", function () {
    expect(state.state).to.deep.equal({a: "a string"});
  });

  it("reducer", function () {
    state.bindReduce('state-test-one', TestFunctions.reducerOne, true);

    const cb = function (ev) {
      expect(ev.detail).to.deep.equal({a: "a string", reducerOne: "reduceData"});
      window.removeEventListener("state-changed", cb);
      delete self["state"];
    };
    window.addEventListener("state-changed", cb);

    window.dispatchEvent(new CustomEvent("state-test-one", {
      bubbles: true,
      composed: true,
      detail: "reduceData"
    }));
  });

  it("two computes", function () {
    state.bindCompute("_computeOne", TestFunctions.computeOne, ["a", "reducerOne"]);
    state.bindCompute("_computeTwo", TestFunctions.computeTwo, ["_computeOne", "a"]);

    const cb = function (ev) {
      expect(ev.detail).to.deep.equal(
        {
          a: "a string",
          reducerOne: "reduceData2",
          _computeOne: "a stringreduceData2",
          _computeTwo: "a stringreduceData2|a string"
        }
      );
      window.removeEventListener("state-changed", cb);
    };
    window.addEventListener("state-changed", cb);

    window.dispatchEvent(new CustomEvent("state-test-one", {
      bubbles: true,
      composed: true,
      detail: "reduceData2"
    }));
  });

  it("observer", function () {
    state.bindObserve(TestFunctions.observeOne, ["_computeTwo"]);

    const cb = function (ev) {
      expect(ev.detail).to.deep.equal(
        {
          a: "a string",
          reducerOne: "reduceData",
          _computeOne: "a stringreduceData",
          _computeTwo: "a stringreduceData|a string"
        }
      );
      expect(window.computeTwoTestValue).to.be.equal("a stringreduceData|a string");
      window.removeEventListener("state-changed", cb);
    };
    window.addEventListener("state-changed", cb);

    window.dispatchEvent(new CustomEvent("state-test-one", {
      bubbles: true,
      composed: true,
      detail: "reduceData"
    }));
  });
});