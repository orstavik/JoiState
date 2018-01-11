class TestFunctions {

  static reducerOne(state, detail) {
    return JoiGraph.setIn(state, "reducerOne", detail);
  }

  static computeOne(a, testOne){
    return a + testOne;
  }

  static computeTwo(_computeOne, a){
    return _computeOne + "|"+ a;
  }

  static observeOne(prop){
    window.computeTwoTestValue = prop;
  }
}