class JoiCompute {

  constructor(maxStackSize, observeOnly) {
    this.maxStackSize = maxStackSize || 100;
    this.functionsRegister = {};
    this.pathRegister = new PathRegister();
    this.observeOnly = observeOnly;
    this.stack = [];
  }

  //here we could reorder the functionsRegister so that the functions with fewest arguments are listed before the functions with more arguments,
  //this could make the functions faster.
  bind(func, pathsAsStrings, returnName) {
    const res = {
      func: func,
      funcName: func.name,
      argsPaths: pathsAsStrings.map(path => this.pathRegister.getUniqueForString(path)),
      argsValue: pathsAsStrings.map(p => undefined)
    };
    if (this.observeOnly)
      return this.functionsRegister[func.name] = res;
    res.returnPath = this.pathRegister.getUniqueForString(returnName);
    res.returnValue = undefined;
    return this.functionsRegister[returnName] = res;
  }

  //this.functionsRegister remember the last situation of the stack run, between updates(!),
  //via argumentValues and returnValues of its functions. Not sure if that is a good thing..
  //but we must have this "between update memory" to avoid running observers and computers when things do not change.
  //the pathsCache is refreshed for every update.
  update(newValue) {
    const start = {functions: this.functionsRegister, pathsCache: this.pathRegister.getPathsCache(newValue)};
    this.stack = JoiCompute.__compute(this.maxStackSize, start, this.observeOnly);
    this.functionsRegister = this.stack[0].functions;
    return JoiCompute.copyAllTheNewCachedValuesIntoTheCurrentPropsState(newValue, this.stack[0].pathsCache);
  }

  //pathsCache is a mutable structure passed into __compute stack
  static __compute(stackRemainderCount, startingPoint, observeOnly) {
    stackRemainderCount = JoiCompute.checkStackCount(stackRemainderCount);

    let workingPoint = startingPoint;
    for (let funcName in workingPoint.functions) {
      const funcObj = workingPoint.functions[funcName];
      const func = funcObj.func;
      const propName = funcObj.returnPath;
      const argsValues = funcObj.argsValue;
      const newArgsValues = funcObj.argsPaths.map(path => workingPoint.pathsCache[path]);

      const isEqual = argsValues.every((v, i) => v === newArgsValues[i]);
      if (isEqual)                      //none of the arguments have changed, then we do nothing.
        continue;

      //todo When we change the workingPoint, we can make a mark in a list which function has triggered a change.
      workingPoint = JoiGraph.setIn(workingPoint, `functions.${funcName}.argsValue`, newArgsValues);
      let newComputedValue = func.apply(null, newArgsValues);
      if (observeOnly)
        continue;
      if (newComputedValue === funcObj.returnValue)    //we changed the arguments, but the result didn't change.
        continue;                                      //Therefore, we don't need to recheck any of the previous functions run.
      workingPoint = JoiGraph.setIn(workingPoint, `functions.${funcName}.returnValue`, newComputedValue);      //todo, we are storing the returnValue in the function as well.. this is not necessary..
      workingPoint = JoiGraph.setIn(workingPoint, `pathsCache.${propName}`, newComputedValue);
      return JoiCompute.__compute(stackRemainderCount, workingPoint, false).concat([workingPoint]);
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

  getStartStopRegisters() {
    return {start: this.stack[this.stack.length-1].functions, stop: this.stack[0].functions};
  }

  static copyAllTheNewCachedValuesIntoTheCurrentPropsState(state, pathsCache) {
    for (let pathString in pathsCache)
      state = JoiGraph.setIn(state, pathString, pathsCache[pathString]);
    return state;
  }
}

class PathRegister {
  constructor() {
    this.register = {};
  }

  getPathsCache(obj) {
    let res = {};
    for (let path in this.register)
      res[path] = JoiGraph.getIn(obj, path);
    return res;
  }

  getUniqueForString(path) {
    this.register[path] = undefined;
    return path;
  }
}
