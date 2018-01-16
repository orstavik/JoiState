/**
 * Created by intertext.no 2017/2018.
 *
 * JoiGraph only works on plain Dictionary objects, ie. objects without a _prototype.
 * The properties of the prototype is not checked.
 * JoiGraph treats BOTH undefined and empty objects "{}" as non-existing, which means that
 * JoiGraph functions will delete from the Dictionary when it is setting values:
 * a) any properties with value undefined
 * b) any objects without properties
 */
class JoiGraph {

  /**
   * @returns {Object} dictionary object with the getOwnProperties of the input object, empty otherwise
   */
  static make(input = {}) {
    const res = Object.create(null, {});
    return Object.assign(res, input);
  }

  /**
   * @returns {boolean} true if input is an Object without a _prototype property
   */
  static isPlainDict(input) {
    return JoiGraph.instanceofObject(input) && !(input instanceof Object);
  }

  static instanceofObject(obj) {
    return typeof obj === "object" && obj !== null;
  }

  /**
   * @returns {boolean} true if the input is either undefined or a completely empty object
   */
  static isNothing(input) {
    return input === undefined || (JoiGraph.instanceofObject(input) && Object.getOwnPropertyNames(input).length === 0);
  }

  /**
   * Equal check that deliberately skips checking the _prototype object.
   * @returns {boolean} true if A and B are the same object, are both nothing, or if all their children equals each other.
   */
  static equals(A, B) {
    if (A === B || (JoiGraph.isNothing(A) && JoiGraph.isNothing(B)))
      return true;
    if (!JoiGraph.instanceofObject(A) || !JoiGraph.instanceofObject(B))
      return false;
    let aProps = Object.getOwnPropertyNames(A);
    let bProps = Object.getOwnPropertyNames(B);
    if (aProps.length !== bProps.length)
      return false;
    for (let key of aProps) {
      if (!Object.hasOwnProperty.call(B, key) || !JoiGraph.equals(A[key], B[key]))
        return false;
    }
    return true;
  }

  static hasProperty(obj, propName) {
    return JoiGraph.instanceofObject(obj) && propName in obj;
  }


  static getInAll(obj, objWithPaths) {
    let res = {};
    for (let path in objWithPaths)
      res[path] = JoiGraph.getIn(obj, path);
    return res;
  }

  /**
   * @returns {*} the value in the object at the given path, or undefined
   */
  static getIn(obj, path) {
    return JoiGraph._getInImpl(obj, JoiGraph._getCachedPath(path));
  }

  //todo with TCO this should be fast as iteration, check to see how many browsers provide TCO on this function
  static _getInImpl(obj, path) {
    if (path.length === 0)
      return obj;
    let propName = path[0];
    if (!JoiGraph.hasProperty(obj, propName))
      return undefined;
    return JoiGraph._getInImpl(obj[propName], path.slice(1));
  }

  /**
   * @returns {Object} a new object with the sub path deleted (and all empty parent branches also removed),
   *          or the same object if the path is outside of the given object graph.
   */
  static deleteIn(obj, path) {
    return JoiGraph._deleteInImpl(obj, JoiGraph._getCachedPath(path));
  }

  static _deleteInImpl(obj, path) {
    if (path.length === 0)
      return undefined;
    if (!JoiGraph.hasProperty(obj, path[0]))
      return obj;
    let child = obj[path[0]];
    let newChild = JoiGraph._deleteInImpl(child, path.slice(1));
    if (newChild === undefined) {
      if (Object.getOwnPropertyNames(obj).length === 1)   //you have just deleted your only child
        return undefined;
      let newObj = Object.assign(Object.create(null, {}), obj);
      delete newObj[path[0]];
      return newObj;
    }
    if (child === newChild)
      return obj;
    let newObj = Object.assign(Object.create(null, {}), obj);
    newObj[path[0]] = newChild;
    return newObj;
  }

  static setInAll(obj, pathsWithValues) {
    for (let pathString in pathsWithValues)
      obj = JoiGraph.setIn(obj, pathString, pathsWithValues[pathString]);
    return obj;
  }

  /**
   *
   * @param obj
   * @param path
   * @param value
   * @returns {Object} a new object with the sub property set, or the same object if there was no difference.
   */
  static setIn(obj, path, value) {
    let cachedPath = JoiGraph._getCachedPath(path);
    if (JoiGraph.isNothing(value))
      return JoiGraph._deleteInImpl(obj, cachedPath);
    const prevValue = JoiGraph._getInImpl(obj, cachedPath);
    if (JoiGraph.equals(prevValue, value))
      return obj;
    return JoiGraph._setInImpl(obj, cachedPath, value);
  }

  static _setInImpl(obj, path, value) {
    if (path.length === 0)
      return JoiGraph.equals(obj, value) ? obj : value;               //this is necessary if the value being set is a big one.

    let child = JoiGraph.instanceofObject(obj) ? obj[path[0]] : undefined;
    let newChild = JoiGraph._setInImpl(child, path.slice(1), value);
    // if (child === newChild)                 //todo removing this option does not seem to break any tests so far.
    //   return obj;

    let newObj = Object.assign(Object.create(null, {}), obj);
    newObj[path[0]] = newChild;
    return newObj;
  }

  static emptyObject(A) {
    return typeof A === "object" && Object.getOwnPropertyNames(A).length === 0;
  }

  /**
   * Null in any branch of B will delete that property in the return object. This works recursively.
   * If the same criteria was set for A in general, it would be impossible to write in a new value for the same key later.
   * @param A
   * @param B
   * @returns {Object} an immutable copy of A with B branches merged into it, or deleted if B branches contains null
   */
  static mergeDeepWithNullToDelete(A, B) {
    if (B === null) return null;
    if (B === undefined || JoiGraph.emptyObject(B))
      return A;
    if (A === undefined || JoiGraph.emptyObject(A))
      return B;
    if (A === B)
      return A;
    if (!(JoiGraph.instanceofObject(A) && JoiGraph.instanceofObject(B)))
      return B;

    let C = Object.assign({}, A);
    let hasMutated = false;
    for (let key of Object.keys(B)) {
      const a = A[key];
      const b = B[key];
      let c = JoiGraph.mergeDeepWithNullToDelete(a, b);
      if (c === a)
        continue;
      hasMutated = true;
      if (c === null)
        delete C[key];
      else
        C[key] = c; //null is also set as a value in C
    }
    if (!hasMutated)
      return A;
    if (Object.keys(C).length === 0)
      return {};
    return C;
  }

  //todo start max
  /**
   * Immutable filter that strips out
   * 1) entries of A that are matching exactly entries in B
   * 2) all empty entries (with undefined or empty objects as value) in A.
   *
   * @param {object} A the object to be filtered
   * @param {object} B the filter
   * @returns A if nothing is filtered away,
   *          undefined if A is empty or the whole content of A is filtered out by B,
   *          a new object C which is an immuted version of the partially filtered A.
   */
  static filterDeep(A, B) {
    const noA = A === undefined || JoiGraph.emptyObject(A);
    const noB = B === undefined || JoiGraph.emptyObject(B);
    if (noA && noB) return undefined;
    if (noB) return A;
    if (noA) return undefined;
    if (A === B) return undefined;
    if (!(JoiGraph.instanceofObject(A)&& JoiGraph.instanceofObject(B))) return A;

    const C = {};
    let hasFiltered = false;
    for (let key of Object.getOwnPropertyNames(A)) {
      const a = A[key];
      const b = B[key];
      if (a === null && b === undefined) {
        hasFiltered = true; //todo Work with this, maybe make a nicer model in realtimeboard.
        continue;
        /*second check is removing A[key]=null && B[key]=undefined*/
      }
      let c = JoiGraph.filterDeep(a, b);
      if (c !== a)
        hasFiltered = true;
      if (c !== undefined)
        C[key] = c;
    }
    if (!hasFiltered)
      return A;
    if (Object.getOwnPropertyNames(C).length === 0)
      return undefined;
    return C;
  }
  //todo stop max

  /**
   * todo how to best freeze it?
   * Function that apply Object.freeze on
   * @param obj
   */
  static deepFreeze(obj) {
    if (JoiGraph.instanceofObject(obj))
      return JoiGraph._deepFreezeImpl(obj);
  }

  /**
   * @param obj MUST BE an object, use the JoiGraph.deepFreeze(obj) if unsure.
   * @private
   */
  static _deepFreezeImpl(obj) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(function (prop) {
      if (JoiGraph.instanceofObject(obj[prop]))
        JoiGraph._deepFreezeImpl(obj[prop]);
    });
    return obj;
  }

  static _getCachedPath(str) {
    return JoiGraph.pathCache[str] || (JoiGraph.pathCache[str] = Object.freeze(str.split(".")));
  }
}

JoiGraph.pathCache = {};
