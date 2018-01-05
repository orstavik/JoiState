class TestFunctions {

  static reducerOne(state, detail) {
    return JoiPath.setIn(state, ["reducerOne"], detail);
  }

  static computeOne(a, testOne){
    return a + testOne;
  }

  static observeOne(prop){
    console.log("The following prop has changed: ", prop);
  }
}