import {JoiGraph} from "./JoiGraph.js";

/**
 * The JoiCompute is a virtual machine for both computing and/or observing functions.
 * Both compute and observe functions should only run when the values of the argument paths that they
 * are bound to changes.
 *
 * The state manager, such as JoiStore, should use a separate JoiCompute for observers and computers.
 * By keeping the observers in a separate container, the state manager can assure that the observers are only run once,
 * after all the computed properties have updated. If not, an observer that listens for two or more computed properties
 * could be called once or twice during each cycle, depending only on the sequence of adding the compute and observe
 * functions, as it would be trigger after one computed parameter changes, or two computed parameters changes.
 */
export class JoiCompute {

  constructor() {
    this.functionsRegister = {};               //immutable during .update
    this.pathRegister = {};                    //immutable during .update
    this.stack = [{functionsRun: [], pathsCache: {}}];    //mutable during .update
  }

  bind(func, pathsAsStrings, returnName) {
    pathsAsStrings.map(path => this.pathRegister[path] = undefined);
    if (returnName)
      this.pathRegister[returnName] = undefined;

    let funKy = returnName + " = " + func.name + "(" + pathsAsStrings.join(", ") + ")";
    this.functionsRegister[funKy] = {
      funKy,
      func: func,
      funcName: func.name,
      argsPaths: pathsAsStrings,
      returnPath: returnName
    };
    // a function below could be put in place sorting so that the functions with the most computed arguments are put last.
    // this.functionsRegister = JoiCompute.sortFunctionsRegister(this.functionsRegister);
  }

  /**
   * this.stack[0].pathsCache is the values of the last run. By checking the values from the last update,
   * compute and observe functions with no paramaters changed since last reducer call are not run.
   * This makes more sense for the developers writing reduce, compute and observe functions, than rerunning all
   * the compute functions from scratch after each reducer.
   *
   * @param newReducedState
   * @returns {Object} newly computed state
   */
  update(newReducedState) {
    this.stack = this._compute(newReducedState, this.stack[0].pathsCache);
    return JoiGraph.setInAll(newReducedState, this.stack[0].pathsCache);
  }

  //todo make a test for this function, to see that it makes something from scratch,
  //todo verify that it does not affect the state of this JoiCompute instance,
  //todo test that the return props from the computes stay the same.
  /**
   * Runs all compute functions from scratch on the input state.
   * Does not affect the remembered state of this JoiCompute instance.
   * @param inputState
   * @returns {{}} inputState with the result from any compute functions added
   */
  computeFromScratch(inputState) {
    const resultStack = this._compute(inputState, {});
    return JoiGraph.setInAll(inputState, resultStack[0].pathsCache);
  }

  _compute(newReducedState, previousRun) {
    let pathsCache = JoiGraph.getInAll(newReducedState, this.pathRegister);
    let perFuncPreviousPathsCache = {};
    for (let funKy of Object.getOwnPropertyNames(this.functionsRegister))
      perFuncPreviousPathsCache[funKy] = previousRun;
    return JoiCompute.__compute(this.functionsRegister, pathsCache, perFuncPreviousPathsCache, []);
  }

  /**
   *
   * @param functions               read-only
   * @param pathsCache              immutable
   * @param perFuncOldPathsCache    immutable
   * @param stack
   * @returns {Object[]} all the pathsCache, the full stack.
   * @private
   */
  static __compute(functions, pathsCache, perFuncOldPathsCache, stack) {
    let functionsRun = [];
    for (let funKy of Object.getOwnPropertyNames(functions)) {
      const funcObj = functions[funKy];

      let previousPathsCache = perFuncOldPathsCache[funKy];
      if (previousPathsCache === pathsCache)        //funcObj has been run on the exact same paths
        continue;

      const argValues = JoiCompute.getChangedArgumentsOrNullIfNoneHasChanged(funcObj.argsPaths, pathsCache, previousPathsCache);
      if (!argValues) {        //none of the arguments have changed, we then update perFuncOldPathsCache and do nothing.
        perFuncOldPathsCache[funKy] = pathsCache;
        continue;
      }

      functionsRun.push(funcObj);
      let newComputedValue = funcObj.func.apply(null, argValues);    //todo 2 here the computer is run...

      perFuncOldPathsCache = Object.assign({}, perFuncOldPathsCache);
      perFuncOldPathsCache[funKy] = pathsCache;
      if (!funcObj.returnPath)
        continue;

      if (newComputedValue === pathsCache[funcObj.returnPath])
        continue;
      pathsCache = Object.assign({}, pathsCache);
      pathsCache[funcObj.returnPath] = newComputedValue;
      const temporaryResult = [{functionsRun, pathsCache}].concat(stack);
      return JoiCompute.__compute(functions, pathsCache, perFuncOldPathsCache, temporaryResult);
    }
    let finalResult = {functionsRun, pathsCache};
    return [finalResult];
  }

  static getChangedArgumentsOrNullIfNoneHasChanged(argsPaths, nowValues, beforeValues) {
    let res = [], changed = false;
    for (let path of argsPaths) {
      if (nowValues[path] !== beforeValues[path] && !JoiGraph.twoNaN(nowValues[path], beforeValues[path]))
        changed = true;
      res.push(nowValues[path]);
    }
    return changed ? res : null;
  }
}