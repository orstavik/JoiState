class JoiCompute {

  constructor(maxStackSize) {
    this.maxStackSize = maxStackSize || 100;
    this.functionsRegister = {};
    this.pathRegister = {};
    this.stack = [{}];
  }

  //here we could reorder the functionsRegister so that the functions with fewest arguments are listed before the functions with more arguments,
  //this could make the functions faster.
  bind(func, pathsAsStrings, returnName) {
    pathsAsStrings.map(path => this.pathRegister[path] = undefined);
    if (returnName)
      this.pathRegister[returnName] = undefined;

    let funKy = returnName + " = " + func.name + "(" + pathsAsStrings.join(", ") + ")";
    this.functionsRegister[funKy] = {
      func: func,
      funcName: func.name,
      argsPaths: pathsAsStrings,
      returnPath: returnName
    };
  }

  //this.functionsRegister remember the last situation of the stack run, between updates(!),
  //via argumentValues and returnValues of its functions. Not sure if that is a good thing..
  //but we must have this "between update memory" to avoid running observers and computers when things do not change.
  //the pathsCache is refreshed for every update.
  update(newValue) {
    let pathsCache = JoiGraph.getInAll(newValue, this.pathRegister);
    let perFuncPreviousPathsCache = {};
    for (let funKy in this.functionsRegister)
      perFuncPreviousPathsCache[funKy] = this.stack[0];
    this.stack = JoiCompute.__compute(this.functionsRegister, this.maxStackSize, pathsCache, perFuncPreviousPathsCache);
    return JoiGraph.setInAll(newValue, this.stack[0]);
  }

  //pathsCache is a mutable structure passed into __compute stack
  static __compute(functions, stackRemainderCount, pathsCache, perFuncOldPathsCache) {
    stackRemainderCount = JoiCompute.checkStackCount(stackRemainderCount);

    for (let funcKey in functions) {
      const funcObj = functions[funcKey];

      let previousPathsCache = perFuncOldPathsCache[funcKey];
      if (previousPathsCache === pathsCache)        //funcObj has been run on the exact same paths
        continue;

      const argValues = JoiCompute.getChangedArgumentsOrNullIfNoneHasChanged(funcObj.argsPaths, pathsCache, previousPathsCache)
      if (!argValues){                            //none of the arguments have changed, then we do nothing.
        perFuncOldPathsCache[funcKey] = pathsCache;
        continue;
      }

      let newComputedValue = funcObj.func.apply(null, argValues);

      perFuncOldPathsCache = Object.assign({}, perFuncOldPathsCache);
      perFuncOldPathsCache[funcKey] = pathsCache;
      if (!funcObj.returnPath)
        continue;

      if (newComputedValue === pathsCache[funcObj.returnPath])
        continue;                                      
      pathsCache = Object.assign({}, pathsCache);
      pathsCache[funcObj.returnPath] = newComputedValue;
      return JoiCompute.__compute(functions, stackRemainderCount, pathsCache, perFuncOldPathsCache).concat([pathsCache]);
    }
    return [pathsCache];
  }

  static getChangedArgumentsOrNullIfNoneHasChanged(argsPaths, pathToValueNow, pathToValueBefore) {
    let res = [], changed = false;
    for (let path of argsPaths) {
      if (pathToValueNow[path] !== pathToValueBefore[path])
        changed = true;
      res.push(pathToValueNow[path]);
    }
    return changed ? res: null;
  }

  static checkStackCount(stackRemainderCount) {
    if (stackRemainderCount >= 0)
      return stackRemainderCount - 1;
    throw new Error(
      "StackOverFlowError in JoiCompute (JoiState). Probably an infinite loop.\n " +
      "Tip: Even if it is not an infinite loop, you should still simplify your compute structure.");
  }
}