// todo
// 1. syntax check for dead end states. We do this by checking each action. If the action is missing a required state (ie. a required state is neither an output of any other action, or a start variable), then we remove this action. We repeat this function recursively until there are no such actions removed in an entire pass). This will remove any loose ends. This can be done at compile time.
//2. if this removes response, or any observers, then this will of course clear the way for any errors.


export const ROOT = {op: 'ROOT'};
export const FRAME = {op: 'FRAME'};
export const EMPTY = {op: 'EMPTY'};
// Parse parameters into either primitive arguments or <op><state> objects.

export function parseParam(p) {
  //primitives
  if(typeof p !== 'string')
    return p;
  //todo test if this works ok.
  // if (p === null) return null;
  // if (p === undefined) return undefined;  //should this become null, make the thing jsony?
  // if (p === false) return false;
  // if (p === true) return true;
  // const num = parseFloat(p);
  // if (num === p) return num;

  //todo these are not yet implemented
  if(p === '*') return ROOT;    //todo reserved words for the full state object
  if(p === '**') return FRAME;  //todo reserved word for the frame (actions, declarations, trace), needed by logs
  if (p === '') return EMPTY;   //todo reserved word for EMPTY

  if (p[0] === '"') return p.substr(1, p.length - 2);
  if (p[0] === "'") return p.substr(1, p.length - 2);

  //<operator [*!&]{0,2}><state [a-z][a-zA-Z]*>
  const [match, op, key] = p.match(/([*!&]{0,2})([a-z][a-zA-Z]*)/) || [];
  if (match)
    return {op, key};
  throw new SyntaxError('Illegal parameter: ' + p);
}

//EMPTY reserved word, and adding the
// const EMPTY = {};

//each operator consists of two functions: compiler and makePrimitives.
//the compiler translates a normalized action into a set of new actions used by the compiler.
//the makePrimitives creates a list of primitive functions that the compiled output depends on.

//[[a, b], #fun, output, error]
//   =>
//[[a, b], fun, _tempOut, error]
//[['actionId', _tempOut], reuse, output]
const hashReuse = {
  makePrimitives: function () {
    const context = {
      _prev: {},
      _function: function reuse(id, value) {
        return reuse(value, this._prev[id]);
      }
    };
    return [{'#reuse': context._function}];
  },
  compiler: function ([id, params, fun, output, error]) {
    fun = fun.substr(1);
    const _tempOut = '_reuse_' + id;
    return [
      [id + OP + 1, [...params], fun, _tempOut, error],
      [id + OP + 2, [`"${id}"`, _tempOut], '#reuse', output]
    ];
  }
};

//todo having three states output from an action would simplify these structures greatly. I need to see what this would look like.
//todo if the function return an Array that is instanceof JoiStateResult, then the last entry is the result.
//todo it is THAT simple..
//todo if no JoiStateResult is returned, it is wrapped as the first entry.
//todo if it fails, it is wrapped as the second entry,
//todo otherwise, we have the option of passing the output as the third, fourth, fifth, etc. result.
//todo nice nice nice... m:n not m:2 graph...

//[[a, b], $fun, output, error]
//   =>
//[[actionId, a, b], tryToReuse, [output, error, none]]
//[[a, b, &none], fun, [output, error]]
//[[actionId, a, b, &&none], observeReuse]


const operators = {
  '!': {
    fun: function makeCache() {
      return {
        _cache: {},
        _function: function cache(value, ...keys) {
          const key = JSON.stringify(keys.length ? keys : keys[0]);
          if (value === EMPTY) {
            if (key in this._cache)
              return this._cache[key] = value;
            throw 'Expected Error, cache function is triggering alternative path.';
          }
          //todo add the reduction of the cache according to operator arguments...
          return this._cache[key] = value;
        }
      }._function
    },
    opName: 'bang',
    funName: 'cache'
  },
  '?': {
    fun: function makeGoldenMean() {
      return {
        _cache: {},
        _function: function goldenMean(value, ...keys) {
          const key = JSON.stringify(keys.length ? keys : keys[0]);
          if (value === EMPTY)
            throw 'Expected Error, goldenMean function is triggering alternative path.';
          if (typeof value !== 'number')
            throw 'goldenMean only tackle number values.';
          const nums = this._cache[key] || (this._cache[key] = []);
          nums.push(value);
          return nums.reduce((a, b) => (a + b)) / nums.length;
        }
      }._function
    },
    opName: 'goldenMean',
    funName: 'goldenMean'
  },
  '#': hashReuse,
}

// [!...params], !fun, out, error
//
//   becomes
//
// [empty, "out", ...bangparams], cache, out, _notInCacheID.
// [...params, &_notInCacheID], fun, _putInCacheID, error.
// [_putInCacheID, "out", ...bangparams], cache, out, _errorPutInCacheID.
//
//bangparams = only arguments with bang in front, but with the bang removed
//params = all arguments with bang removed.
//_notInCacheID is `_notInCache${actionId}`
//_putInCacheID is `_putInCache${actionId}`
//todo Not sure about EMPTY here..
function convertCacheOperator([id, params, fun, output, error], OP, funName, opName) {
  fun = fun.substr(OP.length);
  const bangParams = params.filter(p => p.startsWith(OP)).map(p => p.substr(OP.length));
  params = params.map(p => p.substr(OP.length));                                         //replace only the operator from the params
  const _notInCacheID = `_notIn${opName + id}`;
  const _putInCacheID = `_putIn${opName + id}`;
  const _errorPutInCacheID = `_errorPutIn${id}`;
  return [
    [id + OP + 1, [EMPTY, `"${output}"`, ...bangParams], funName, output, _notInCacheID],
    [id + OP + 2, [...params, '&' + _notInCacheID], fun, _putInCacheID, error],
    [id + OP + 3, [_putInCacheID, `"${output}"`, ...bangParams], funName, output, _errorPutInCacheID]
  ];
}

// [something, bob, test1, test2, test3], fun, [case1, case2, case3], else
//
//   becomes
//
// [something, bob, test1], fun, case1, _else_ID_0
// [something, bob, test2, &_else_ID_0, &&case1], fun, case2, _else_ID_1
// [something, bob, test3, &_else_ID_1, &&case1, &&case2], fun, case3, else

// [something, test1, test2, test3], equals, [case1, case2, case3], else
//
//   becomes
//
// [something, test1], equals, case1, _else_ID_1
// [something, test2, &_else_ID_1, &&case1], equals, case2, _else_ID_2
// [something, test3, &_else_ID_2, &&case1, &&case2], equals, case3, else
//todo untested

function convertArrayOutput(action) {        //todo ,OP, FunName?
  let [id, params, fun, output, error] = action;
  id = id + 'x';                    //todo use OP here
  const otherArgs = params.slice(0, params.length - output.length);
  return output.map((caseI, i) => {
    const testI = params[otherArgs.length + i];
    const ps = [...otherArgs, testI];
    i && ps.push(`&_else_${id}_${i}`);
    for (let j = i; j > 0; j--)
      ps.push('&&' + output[j - 1]);
    const alternative = i + 1 === output.length ? error : `_else_${id}${i + 1}`;
    return [id + i, ps, fun, caseI, alternative];
  });
}


function compileCacheActions(actions, operators) {
  let res = [], primitives = [], checkedOperators = new Set();
  main: for (let action of actions) {
    // if (action[3] instanceof Array) {
    //   res = res.concat(convertArrayOutput(action))
    //   continue main;
    // }
    for (let OP in operators) {
      const {makePrimitives, compiler} = operators[OP];
      if (!action[2].startsWith(OP))
        continue;
      if (!checkedOperators.has(OP)) {
        checkedOperators.add(OP);
        primitives.push(makePrimitives());
      }
      res = res.concat(compiler(action));
      continue main;
    }
    res.push(action);
  }
  return {actions: res, declarations: primitives};
}

function nextOperator(actions) {
  for (let index = 0; index < actions.length; index++) {
    let action = actions[index];
    const [match, op] = action[2].match(/([^_a-z]+)/);
    if (op)
      return {action, index, op};
  }
  return {};
}

//todo debug this one.
function compileOperators(actions, operators) {
  const addedPrimitives = new Set();
  let opMatch;
  while (opMatch = nextOperator(actions)) {
    let {action, index, op} = opMatch;
    const OP = Object.keys(operators).find(OP => op.startsWith(OP));
    const {compiler, makePrimitive} = operators[OP];
    if (!addedPrimitives.has(OP))
      addedPrimitives.add(makePrimitive);
    actions.splice(index, 1, compiler(action));
  }
}

export function compile(actions) {
  actions = actions.map((a, i) => (a = [i, ...a], a.length === 3 && a.push([]), a)); //adding empty for observer
  actions.forEach(action => action[1] = action[1].map(p => parseParam(p)));
  return {actions, declarations: {}};
  // const {actions: actions2, declarations} = compileCacheActions(actions, operators);
  // actions2.forEach(action => action[1] = action[1].map(p => parseParam(p)));
  // return {actions: actions2, declarations};
}

/**
 * BUILTIN FUNCTIONS
 */
// first:  a => a
// fail:   a => throw a
export const BUILTIN = {
  get: function get(obj, path) {
    if (!path)
      return obj;
    if (!(obj instanceof Object))
      throw new SyntaxError('The action "get" is given an illegal object: ' + typeof obj);
    if (typeof path !== 'string')
      throw new SyntaxError('The action "get" is given an illegal path: ' + typeof path);
    for (let segment of path.split('.')) {
      if (obj instanceof Headers || obj instanceof URLSearchParams)
        obj = obj[segment] || obj.get(segment);
      else
        obj = obj[segment];
    }
    return obj;
  },
  equals: function equals(...args) {   //todo untested
    if (args.length === 1 ? !!args[0] : args[0] === args[1])
      return args[0];
    throw 'else';
  }
}