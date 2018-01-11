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
    const start = {
      functions: this.functionsRegister,
      pathsCache: JoiCompute.getInAll(newValue, this.pathRegister),
      functionsLastRunRegister : this.functionsLastRunRegister
    };
    this.stack = JoiCompute.__compute(this.maxStackSize, start, this.observeOnly);
    this.functionsLastRunRegister = this.stack[0].functionsLastRunRegister;
    return JoiCompute.setInAll(newValue, this.stack[0].pathsCache);
  }

  //pathsCache is a mutable structure passed into __compute stack
  static __compute(stackRemainderCount, workingPoint, observeOnly) {
    stackRemainderCount = JoiCompute.checkStackCount(stackRemainderCount);

    for (let funcKey in workingPoint.functions) {
      const funcObj = workingPoint.functions[funcKey];       //this is a this.functionsRegister copy that never change
      const prevPathsCache = workingPoint.functionsLastRunRegister[funcKey];

      const isEqual = funcObj.argsPaths.every(path => prevPathsCache[path] === workingPoint.pathsCache[path]);
      if (isEqual)                      //none of the arguments have changed, then we do nothing.
        continue;
      const newArgsValues = funcObj.argsPaths.map(path => workingPoint.pathsCache[path]);
      let newComputedValue = funcObj.func.apply(null, newArgsValues);

      workingPoint = JoiGraph.setIn(workingPoint, `functionsLastRunRegister.${funcKey}`, workingPoint.pathsCache);
      if (observeOnly)
        continue;
      if (newComputedValue === workingPoint.pathsCache[funcObj.returnPath])    //we changed the arguments, but the result didn't change.
        continue;                                      //Therefore, we don't need to recheck any of the previous functions run.
      workingPoint = JoiGraph.setIn(workingPoint, `pathsCache.${funcObj.returnPath}`, newComputedValue);
      return JoiCompute.__compute(stackRemainderCount, workingPoint, observeOnly).concat([workingPoint]);
    }
    return [workingPoint];
  }

  static checkStackCount(stackRemainderCount) {
    if (stackRemainderCount >= 0)
      return stackRemainderCount - 1;
    throw new Error(
      "StackOverFlowError in JoiCompute (JoiState). Probably an infinite loop.\n " +
      "Tip: Even if it is not an infinite loop, you should still simplify your compute structure.");
  }

  static setInAll(state, pathsWithValues) {
    for (let pathString in pathsWithValues)
      state = JoiGraph.setIn(state, pathString, pathsWithValues[pathString]);
    return state;
  }

  static getInAll(obj, paths) {
    let res = {};
    for (let path in paths)
      res[path] = JoiGraph.getIn(obj, path);
    return res;
  }
}