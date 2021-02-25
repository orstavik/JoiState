
// todo
// 1. syntax check for dead end states. We do this by checking each action. If the action is missing a required state (ie. a required state is neither an output of any other action, or a start variable), then we remove this action. We repeat this function recursively until there are no such actions removed in an entire pass). This will remove any loose ends. This can be done at compile time.
//2. if this removes response, or any observers, then this will of course clear the way for any errors.


import {JoiStateResult} from "./statemachine.js";

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
        if(!prev)
          return new JoiStateResult([, true]);
        for (let i = 0; i < args.length; i++) {
          if (prev[i] !== args[i])
            return new JoiStateResult([,true]);
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
//[[&notFound, ...args], fun, [...outputs]]
//[[&notFound, actionId, numberArgsCount, ...args, ...outputs], toCache]

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
        if(before === EMPTY || before === after)
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

export function compile(actions) {
  actions = actions.map((a, i) => (a = [i, ...a], a.length === 3 && a.push([]), a)); //adding empty for observer
  let compileOutput = compileCacheActions(actions, operators);
  actions = compileOutput.actions;
  let declarations = compileOutput.declarations;
  actions.forEach(action => action[1] = action[1].map(p => parseParam(p))); //todo this is linking, here we should maybe link some arguments too..
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
    if(!match)
      res[testCases.length] = something;
    return new JoiStateResult(res);
  },
  and: function and(...testCases) {
    for (let i = 0; i < testCases.length; i++) {
      if(!testCases[i])
        return new JoiStateResult([,true]);
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