// todo
// 1. syntax check for dead end states. We do this by checking each action. If the action is missing a required state (ie. a required state is neither an output of any other action, or a start variable), then we remove this action. We repeat this function recursively until there are no such actions removed in an entire pass). This will remove any loose ends. This can be done at compile time.
//2. if this removes response, or any observers, then this will of course clear the way for any errors.

//A is the new object, B is the old object, A is the object we return.
//attention mutates argument a.

export function reuse(a, b) {
  if (a === b || !(a instanceof Object && b instanceof Object))
    return a;
  let mismatch = false;
  let c = {};
  for (let key in a) {
    const aValue = a[key];
    const bValue = b[key];
    c[key] = reuse(aValue, bValue) === bValue ? bValue : (mismatch = true) && aValue;
  }
  return !mismatch && Object.keys(a).length === Object.keys(b).length ? b : c;
}

const reuseImpl = reuse;

export const EMPTY = {};

// Parse parameters into either primitive arguments or <op><state> objects.

//todo should undefined become null, make the thing jsony?
export function parseParam(p) {
  //primitives
  if (typeof p !== 'string')
    return p;

  //todo these are not yet implemented
  if (p === '*') return {op: 'ROOT'};    //todo reserved words for the full state object
  if (p === '**') return {op: 'FRAME'};  //todo reserved word for the frame (actions, declarations, trace), needed by logs
  if (p === '') return EMPTY;    //todo reserved word for EMPTY
  //todo add ^ and ^^ as function references operators?

  if (p[0] === '"') return p.substr(1, p.length - 2);
  if (p[0] === "'") return p.substr(1, p.length - 2);
  if (p[0] === "_") return {op: '', key: p};  //todo hack to avoid having the parseParam change the p

  //<operator [*!&]{0,2}><state [a-z][a-zA-Z]*>
  const [match, op, key] = p.match(/([*!&]{0,2})([a-z_][a-zA-Z_0-9]*)/) || [];
  if (match)
    return {op, key};
  throw new SyntaxError('Illegal parameter: ' + p);
}

//each operator consists of two functions: compiler and makePrimitives.
//the compiler translates a normalized action into a set of new actions used by the compiler.
//the makePrimitives creates a list of primitive functions that the compiled output depends on.

// #reuse
// [[...args], #fun, [...outputs]]
//   =>
//[[...args], fun, [..._tempID_outputs]]
//[['actionId', ..._tempID_outputs], reuse, [...outputs]]
const hashReuse = {
  makePrimitives: function () {
    const _prev = {};
    return {
      '#reuse': function reuse(id, ...args) {
        const reused = [];
        for (let i = 0; i < args.length; i++) {
          if (i in args)
            _prev[id + i] = reused[i] = reuseImpl(args[i], _prev[id + i]);
        }
        return new JoiStateResult(reused);
      }
    }
  },
  compiler: function ([id, params, fun, outputs]) {
    fun = fun.substr(1);
    const _tmpOutputs = outputs.map(output => `_reuse_${id}_${output}`);
    return [
      [id + "#1", params, fun, _tmpOutputs],
      [id + "#2", [`"${id}"`, ..._tmpOutputs], '#reuse', outputs]
    ];
  }
};

// ##skip
//[[...args], ##fun, [...outputs]]
//   =>
//[['skip${id}', ...args], skip, [_skip_id, _dont_skip_id]]
//[[&&_skip_id, ...args], fun, [...outputs]]
const hashHashSkip = {
  makePrimitives: function () {
    const _prev = {};
    return {
      '##skip': function skip(id, ...args) {
        const prev = _prev[id];
        _prev[id] = args;
        if (!prev)
          return new JoiStateResult([, true]);
        for (let i = 0; i < args.length; i++) {
          if (prev[i] !== args[i])
            return new JoiStateResult([, true]);
        }
        return new JoiStateResult([true]);
      }
    }
  },
  compiler: function ([id, params, fun, outputs]) {
    fun = fun.substr(2);
    const skipName = `_skip_${id}`;
    return [
      [id + "##1", [`"${skipName}"`, ...params], '##skip', [skipName, `_dont${skipName}`]],
      [id + "##2", [...params, `&&${skipName}`], fun, outputs]
    ];
  }
};

//!cache

//[[...args], !fun, [...outputs]]
//   =>
//[[actionId, ...args], fromCache, [notFound, ...outputs]]
//[[...args, &notFound], fun, [...outputs]]
//[[&notFound, actionId, numberArgsCount, ...args, ...outputs], toCache, []]

//todo add notFound as first argument to writeCache(notFoundIgnore, ...

const bangCache = {
  makePrimitives: function () {
    const _prev = {};
    return {
      readCache: function readCache(id, ...args) {
        const key = JSON.stringify([id, ...args]);
        return new JoiStateResult(key in _prev ? _prev[key] : [true]);
      },
      writeCache: function writeCache(id, argCount, ...argsAndOutput) {
        const args = argsAndOutput.slice(0, argCount);
        const key = JSON.stringify([id, ...args]);

        //todo here we need to take care in writing the result with unset properties.. todo test this
        const cached = [];
        for (let i = argCount; i < argsAndOutput.length; i++)
          i in argsAndOutput && (cached[i - argCount + 1] = argsAndOutput[i]);
        //todo here we need to take care in writing the result with unset properties.. todo test this
        _prev[key] = cached;
      }
    };
  },
  compiler: function ([id, params, fun, outputs]) {
    fun = fun.substr(1);
    return [
      [id + '!1', [`"${id}"`, ...params], 'readCache', ['notFound', ...outputs]],
      [id + '!2', [...params, '&notFound'], fun, outputs],
      [id + '!3', [`"${id}"`, params.length, ...params, ...outputs, '&notFound'], 'writeCache', []],
    ];
  }
};

//todo this should always be the innermost operator. Do we need some priority rules/values for our operators?
const questionMutationCheck = {
  makePrimitives: function () {
    return {
      mutationCheck: function mutationCheck(before, ...args) {
        const after = JSON.stringify(args);
        if (before === EMPTY || before === after)
          return new JoiStateResult([after]);
        return new JoiStateResult([, {before, after}]);
      }
    };
  },
  compiler: function ([id, params, fun, outputs]) {
    fun = fun.substr(1);
    const mutationCheck1 = `_mutation_check_${id}_1`;
    const mutationCheck2 = `_mutation_check_${id}_2`;
    const mutationError = `_mutation_error_${id}`;
    return [
      [id + '?1', ['', ...params], 'mutationCheck', [mutationCheck1]],
      [id + '?2', [...params], fun, outputs],
      [id + '?3', [mutationCheck1, ...params], 'mutationCheck', [mutationCheck2, mutationError]],
    ];
  }
};

const operators = {
  '!': bangCache,
  '##': hashHashSkip,
  '#': hashReuse,
  '?': questionMutationCheck,
};

//todo make this output an object/a map with the actions, and not an  array?
function compileCacheActions(actions, operators) {
  let res = [], primitives = {}, checkedOperators = new Set();
  main: for (let action of actions) {
    for (let OP in operators) {
      const {makePrimitives, compiler} = operators[OP];
      if (!action[2].startsWith(OP))
        continue;
      if (!checkedOperators.has(OP)) {
        checkedOperators.add(OP);
        primitives = Object.assign(primitives, makePrimitives());
      }
      res = res.concat(compiler(action));
      continue main;
    }
    res.push(action);
  }
  return {actions: res, declarations: primitives};
}

//returns two arrays, the first with the params without the operator, the second with the params with the operator extracted.
function transformSplit(inputArray, op) {
  let a = [], b = [];
  for (let i = 0; i < inputArray.length; i++) {
    let x = inputArray[i];
    if (typeof x === "string" && x[0] !== '_' && x.indexOf(op) >= 0)
      b[i] = x.replace(op, '');
    else
      a[i] = x;
  }
  return [a, b];
}

function updateAndReplace(actions, transformer) {
  let result = [];
  for (let action of actions) {
    const res = transformer(action);
    if (res) result = [...result, ...res];
    else result.push(action);
  }
  return result;
}

// [*a, b, *c, 12], fun, [d, e]
//   =>
// [b, 12], rename, [_ready_fun]
// [a, _ready_fun], rename, [_ready_a]
// [undefined, _ready_fun], rename, [_ready_a]
// [c, _ready_fun], rename, [_ready_c]
// [undefined, _ready_fun], rename, [_ready_c]
// [_ready_a, b, _ready_c, 12], fun, [d, e]
//
// [*a, *b, *c], fun, [d]
//   =>
// [a], rename, [_ready_fun]
// [b], rename, [_ready_fun]
// [c], rename, [_ready_fun]
// [a, _ready_fun], rename, [_ready_a]
// [undefined, _ready_fun], rename, [_ready_a]
// [b, _ready_fun], rename, [_ready_b]
// [undefined, _ready_fun], rename, [_ready_b]
// [c, _ready_fun], rename, [_ready_c]
// [undefined, _ready_fun], rename, [_ready_c]
// [_ready_a, _ready_b, _ready_c], fun, [d]

function starArgs([id, params, fun, outputs]) {
  let [otherParams, starParams] = transformSplit(params, '*');
  if (!starParams.length)
    return;
  const readyParam = '_ready_fun_*_' + id;
  const newParamName = id + '_*_';
  const res = otherParams.length ?
    [[newParamName + 0, otherParams.filter((p, i, ar) => i in ar), 'rename', [readyParam]]] :
    starParams.map((p, i) => [newParamName + i, [p], 'rename', [readyParam]]);
  let i = res.length;
  for (let p of starParams.filter((p, i, ar) => i in ar)) {
    res.push([newParamName + i + 'a', [p, readyParam], 'rename', ['_' + p + '_*']]);
    res.push([newParamName + (i++) + 'b', [undefined, readyParam], 'rename', ['_' + p + '_*']]);
  }
  res.push([id, params.map((p, i) => i in starParams ? '_' + starParams[i] + '_*' : p), fun, outputs]);
  return res;
}

//&arg and *arg combination = 1. &arg first, 2. then *arg, 3. *arg is preserved when &arg is processed.
//[&a, b, *c, &d], fun, [e, f]
//  =>
//[a, b, *c, d], rename, [_renamed_a, _renamed_b, _renamed_c, _renamed_d]
//[_renamed_b, _renamed_c], fun, [e, f]

//[&a, b, c, &d], fun, [e, f]
//   =>
// [a, b, c, d], rename, [_renamed_a, _renamed_b, _renamed_c, _renamed_d]
// [_renamed_b, _renamed_c], fun, [e, f]
function compileAndParameters([id, params, fun, outputs]) {
  let [filteredParams, andParams] = transformSplit(params, '&');
  if (!andParams.length)
    return;
  filteredParams = filteredParams.filter((el, i, ar) => i in ar);
  const renamed = filteredParams.map(p => typeof p === 'string' ? '_renamed_' + p : p)
  return [
    [id + '_&_' + 1, [...filteredParams, ...andParams], 'rename', renamed],
    [id + '_&_' + 2, renamed, fun, outputs]
  ];
}

// [a, b, c], fun, [d, &e]
//   =>
// [a, b, c], rename, [_rename_a, _rename_b, _rename_c, e]
// [_rename_a, _rename_b, _rename_c], fun, [d]
function compileAndOutput([id, params, fun, outputs]) {
  let [otherOutputs, andOutputs] = transformSplit(outputs, '&');
  if (!andOutputs.length)
    return;
  andOutputs = andOutputs.filter((el, i, ar) => i in ar);
  const renamed = params.map(p => typeof p === 'string' ? '_' + p + '_&2' : p)
  return [
    [id + '_&2_' + 1, [...params, ...andOutputs], 'rename', renamed],
    [id + '_&2_' + 2, renamed, fun, otherOutputs]
  ];
}

// [a, b, c], fun, [*d, e, *f]
//   =>
// [a, b, c], fun, [_temp_d, e, _temp_f]
// [_temp_d], rename, [d]
// [_temp_f], rename, [f]
function compileStarOutput([id, params, fun, outputs]) {
  let [otherOutputs, starOutputs] = transformSplit(outputs, '*');
  if (!starOutputs.length)
    return;
  const res = starOutputs
    .filter((_, i, ar) => i in ar)
    .map((p, i) => [id + '_*2_' + (i + 1), ['_' + p + '_*2'], 'rename', [p]]);
  outputs = outputs.map((p, i) => i in starOutputs ? '_' + starOutputs[i] + '_*2' : p);
  res.unshift([id + '_*2_0', params, fun, outputs]);
  return res;
}

export function compile(actions) {
  //1. turn '"strings"' and '**' and '*' into new String('strings'), new String('**'), new String('*')
  actions = actions.map(action => {
    action = action.slice();
    action[0] = action[0].map(p => {
      if (typeof p !== 'string')
        return p;
      if (p[0] === '"' && p[p.length - 1] === '"' || p[0] === "'" && p[p.length - 1] === "'")
        return new String(p.substr(1, p.length - 2));               //todo find some other kind of object to do this with.
      if (p === '**' || p === '*')
        return new String(p)                                        //todo find some other kind of object to do this with.
      return p;
    });
    return action;
  });
  //syntax check that no parameter has both *&
  // for (let action of actions) {
  //   const [params] = action;
  //   for (let p of params) {
  //     if (typeof p !== 'string')
  //       continue;
  //     //todo ensure that the format is operator(s) + string
  //     //todo ensure that only one operator is set at a time
  //     if (p.indexOf('&') >= 0 && p.indexOf('*') >= 0)
  //       throw new SyntaxError('action parameters cannot have both "&" and "*" operators: ' + JSON.stringify(action));
  //   }
  // }
  actions = actions.map((a, i) => (a.length === 2 && a.push([]), [i, ...a])); //adding id and empty output for observers
  const compileOperations = [
    compileAndParameters,
    starArgs,
    compileAndOutput,
    compileStarOutput
  ];
  for (let transformer of compileOperations)
    actions = updateAndReplace(actions, transformer)
  return actions;
  //compile function operators
  let compileOutput = compileCacheActions(actions, operators);
  actions = compileOutput.actions;
  let declarations = compileOutput.declarations;
  // actions.forEach(action => action[1] = action[1].map(p => parseParam(p))); //todo this is linking, here we should maybe link some arguments too..
  return {actions, declarations};
}

/**
 * BUILTIN FUNCTIONS
 */
// first:  a => a
// fail:   a => throw a
export const BUILTIN = {                          //todo these Builtin functions are not yet in use, but they should work ok.
  get: function get(obj, path) {
    if (!path)
      return new JoiStateResult([obj]);
    if (!(obj instanceof Object))
      throw new JoiStateResult([, new SyntaxError('The action "get" is given an illegal object: ' + typeof obj)]);
    if (typeof path !== 'string')
      throw new JoiStateResult([, new SyntaxError('The action "get" is given an illegal path: ' + typeof path)]);
    for (let segment of path.split('.')) {
      if (obj instanceof Headers || obj instanceof URLSearchParams)
        obj = obj[segment] || obj.get(segment);
      else
        obj = obj[segment];
    }
    return new JoiStateResult([obj]);
  },
  //todo untested
  set: function (arg, outputPos = 0) {
    const res = [];
    res[outputPos] = arg;
    return new JoiStateResult(res);
  },
  //todo
  // Multiple equals have different roles. You can imagine equals in:
  // if (a === x) then a() else if(b === x) then b()
  // or
  // if(a === x && b === x) then ab()
  //
  //however, with multiple outputs, there is no need to choose. You can have both at the same time
  //[test, 'one', 'two', 'one', 'one'], equals, [a,b,c,d,else]
  //if test === 'one', then the output will be [a='one', , c='one', d='one']
  equals: function equals(something, ...testCases) {
    const res = [];
    let match = false;
    for (let i = 0; i < testCases.length; i++) {
      let testCase = testCases[i];
      if (something === testCase) {
        res[i] = something;
        match = true;
      }
    }
    if (!match)
      res[testCases.length] = something;
    return new JoiStateResult(res);
  },
  and: function and(...testCases) {
    for (let i = 0; i < testCases.length; i++) {
      if (!testCases[i])
        return new JoiStateResult([, true]);
    }
    return new JoiStateResult([true]);
  },
  //todo
  // 1. all the primitive math operators in js
  // 2. all the primitive comparator operators in js
  // 3. add some cool ternary operators, such as a<=x<=b, where x is in between a and b
  // 5. ^ for function references as arguments? ^^ for references to the function id?
  // 6. loop structures. use ...in front of function name to trigger an iteration of all arguments that begin with ...?

  //todo
  // a. when we are linking, we could link up with primitive js functions, such as Array.map.
}