// todo
// 1. syntax check for dead end states. We do this by checking each action. If the action is missing a required state (ie. a required state is neither an output of any other action, or a start variable), then we remove this action. We repeat this function recursively until there are no such actions removed in an entire pass). This will remove any loose ends. This can be done at compile time.
//2. if this removes response, or any observers, then this will of course clear the way for any errors.


import {JoiStateResult} from "./statemachine.js";
import {reuse as reuseImpl} from "./JoiStore.js";

export const ROOT = {op: 'ROOT'};
export const FRAME = {op: 'FRAME'};
export const EMPTY = {op: 'EMPTY'};

// Parse parameters into either primitive arguments or <op><state> objects.

export function parseParam(p) {
  //primitives
  if (typeof p !== 'string')
    return p;
  //todo test if this works ok.
  // if (p === null) return null;
  // if (p === undefined) return undefined;  //should this become null, make the thing jsony?
  // if (p === false) return false;
  // if (p === true) return true;
  // const num = parseFloat(p);
  // if (num === p) return num;

  //todo these are not yet implemented
  if (p === '*') return ROOT;    //todo reserved words for the full state object
  if (p === '**') return FRAME;  //todo reserved word for the frame (actions, declarations, trace), needed by logs
  if (p === '') return EMPTY;   //todo reserved word for EMPTY

  if (p[0] === '"') return p.substr(1, p.length - 2);
  if (p[0] === "'") return p.substr(1, p.length - 2);
  if (p[0] === "_") return {op: '', key: p};  //todo hack to avoid having the parseParam change the p

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

//[[...args], #fun, [...outputs]]
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


const operators = {
  '!': bangCache,
  '#': hashReuse,
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
  actions.forEach(action => action[1] = action[1].map(p => parseParam(p)));
  return {actions, declarations};
  // actions2.forEach(action => action[1] = action[1].map(p => parseParam(p)));
  // return {actions: actions2, declarations};
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
      throw new JoiStateResult([,new SyntaxError('The action "get" is given an illegal object: ' + typeof obj)]);
    if (typeof path !== 'string')
      throw new JoiStateResult([,new SyntaxError('The action "get" is given an illegal path: ' + typeof path)]);
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
  //todo untested. the primitive functions can be checked to see if their arguments and output counts are valid.
  equals: function equals(something, ...testCases) {
    const res = [];
    for (let i = 0; i < testCases.length; i++) {
      let testCase = testCases[i];
      if (something === testCase) {
        res[i] = something;
        return new JoiStateResult(res);
      }
    }
    res[testCases.length] = something;
    return new JoiStateResult(res);
  }
}