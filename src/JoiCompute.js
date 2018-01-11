class JoiCompute {

  constructor(maxStackSize, observeOnly) {
    this.maxStackSize = maxStackSize || 100;
    this.functionsRegister = {};
    this.functionsLastRunRegister = {};
    this.pathRegister = {};
    this.observeOnly = observeOnly;
    this.stack = [];
  }

  //here we could reorder the functionsRegister so that the functions with fewest arguments are listed before the functions with more arguments,
  //this could make the functions faster.
  bind(func, pathsAsStrings, returnName) {
    pathsAsStrings.map(path => this.pathRegister[path] = undefined);
    if (!this.observeOnly)
      this.pathRegister[returnName] = undefined;
    const res = {
      func: func,
      funcName: func.name,
      argsPaths: pathsAsStrings,
      returnPath: returnName
    };
    this.functionsLastRunRegister[res.returnPath + res.funcName] = {};
    this.functionsRegister[res.returnPath + res.funcName] = res;
  }

  //this.functionsRegister remember the last situation of the stack run, between updates(!),
  //via argumentValues and returnValues of its functions. Not sure if that is a good thing..
  //but we must have this "between update memory" to avoid running observers and computers when things do not change.
  //the pathsCache is refreshed for every update.
  update(newValue) {
    let pathsCache = JoiGraph.getInAll(newValue, this.pathRegister);
    let functionsLastRunRegister = this.functionsLastRunRegister;
    this.stack = JoiCompute.__compute(this.functionsRegister, this.maxStackSize, pathsCache, functionsLastRunRegister, this.observeOnly);
    for (let funKy in this.functionsRegister)
      this.functionsLastRunRegister[funKy] = this.stack[0];
    return JoiGraph.setInAll(newValue, this.stack[0]);
  }

  //pathsCache is a mutable structure passed into __compute stack
  static __compute(functions, stackRemainderCount, pathsCache, functionsLastRunRegister, observeOnly) {
    stackRemainderCount = JoiCompute.checkStackCount(stackRemainderCount);

    for (let funcKey in functions) {
      const funcObj = functions[funcKey];       //this is a this.functionsRegister copy that never change
      const prevPathsCache = functionsLastRunRegister[funcKey];

      const isEqual = funcObj.argsPaths.every(path => prevPathsCache[path] === pathsCache[path]);
      if (isEqual)                      //none of the arguments have changed, then we do nothing.
        continue;
      const newArgsValues = funcObj.argsPaths.map(path => pathsCache[path]);
      let newComputedValue = funcObj.func.apply(null, newArgsValues);

      functionsLastRunRegister = JoiGraph.setIn(functionsLastRunRegister, funcKey, pathsCache);
      if (observeOnly)
        continue;

      if (JoiGraph.equals(newComputedValue, pathsCache[funcObj.returnPath]))    //we changed the arguments, but the result didn't change.
        continue;                                      //Therefore, we don't need to recheck any of the previous functions run.
      pathsCache = JoiGraph.setIn(pathsCache, funcObj.returnPath, newComputedValue);
      return JoiCompute.__compute(functions, stackRemainderCount, pathsCache, functionsLastRunRegister, observeOnly).concat([pathsCache]);
    }
    return [pathsCache];
  }

  static checkStackCount(stackRemainderCount) {
    if (stackRemainderCount >= 0)
      return stackRemainderCount - 1;
    throw new Error(
      "StackOverFlowError in JoiCompute (JoiState). Probably an infinite loop.\n " +
      "Tip: Even if it is not an infinite loop, you should still simplify your compute structure.");
  }
}