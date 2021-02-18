import {run} from "./statemachine.js";
import {compile, parseParam} from "./compiler.js";

//A is the new object, B is the old object, A is the object we return.
export function reuse(a, b) {
  if (a === b)
    return b;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null)
    return a;
  let mismatch = Object.keys(a).length !== Object.keys(b).length;
  for (let [key, aValue] of Object.entries(a)) {
    const bValue = b[key];
    if (reuse(aValue, bValue) === bValue)
      a[key] = bValue;
    else
      mismatch = true;
  }
  return mismatch ? a : b;
}

function deepFreeze(obj) {
  if (typeof obj !== 'object' || obj === null)
    return;
  Object.freeze(obj);
  for (let val in Object.values(obj))
    deepFreeze(val);
}

function findActionThatOutput(prop, actions) {
  return actions.find(([i, p, f, o, e]) => o === prop || e === prop);
}

//The stateMachine a) starts the inner statemachine and b) monitors the state of the response and observers.
function stateMachine(actions, state, tracers, declarations) {

  // function onTrace(frame, txt) {
    //todo tracers key must contain the txt, and only run a tracer one time.
    // tracers[txt] && tracers[txt](frame);
    //todo this doesn't work right now..
  // }


  // const actionsClone = actions.map(action=> action.slice());
  //todo actions should be a map with keys, not an array with numbers. as the actions id are now different.
  //todo the keys can then be sorted alphabetically/numerically
  run({actions/*: actionsClone*/, state, /*onTrace, */count: 0, invocations: {}, resolutions: {}, declarations});

  //todo replace this with a different actions and a custom method.
  // if ('ready' in state)
  //   return state.ready;
  // if (!findActionThatOutput('ready', actions))
  //   return true;
  // let readyResolver;
  // let ready = new Promise(r => readyResolver = r);
  // tracers.eo = tracers.eo || [];
  // tracers.eo.push(() => 'ready' in state && readyResolver(state.ready));
  // return ready;
}

//todo the reducer makes a new state using only the "reducer properties" and

function reduceImpl(state, propName, newValue, reducerProps) {
  newValue = reuse(newValue, state[propName]);
  if (newValue === state[propName])
    return state;
  const nextState = reducerProps.reduce((res, prop) => (res[prop] = state[prop], res), {});
  nextState[propName] = newValue;
  return nextState;
}

//todo do we observe cycle, or do we observe change?
// we observe change, and so we must dirtycheck all the properties to see if the arguments are the same as last time.
// if we want to observe cycle, then we add NaN as a fixed parameter, as NaN === NaN => trick

export class JoiStore {

  constructor(initialState = {}, actionsIn = [], declarations = {}) {
    //compile and link up the actions coming in
    let {actions, declarations: primitives} = compile(actionsIn); //throw if compiler or linking error
    declarations = Object.assign(declarations, primitives);
    actions.forEach(action => action[2] = declarations[action[2]]);  //link up functions in actions
    this.actions = actions;

    this.state = initialState;
    deepFreeze(this.state);
    this.lock = false;
    this.queue = [];
    this.reducerProps = [];
  }

  async reduce(propName, newValue) {
    this.reducerProps.indexOf(propName) === -1 && this.reducerProps.push(propName);
    this.queue.push([propName, newValue]);
    if (this.lock)
      return;
    this.lock = true;

    while (this.queue.length) {
      let [propName, newValue] = this.queue.shift();
      const nextState = reduceImpl(this.state, propName, newValue, this.reducerProps);
      if (nextState === this.state)   //the reducer do not produce state, so no operation should run
        continue;

      //todo how to add declarations to the frame? i somehow need to add the ready check when the actions are compiled

      let ready = stateMachine(this.actions, nextState, {});   //run the state machine
      if (ready instanceof Promise)                             //if this is an async statemachine, then await
        ready = await ready;
      if (ready)                                                //if when ready, update the state.
        this.state = nextState;
      deepFreeze(this.state);   //todo should we do this?? to lock the state for future promise returns?
    }
    this.lock = false;
  }

  compute(params, func, output, error) {
    const id = this.actions.length;
    params = params.map(p => parseParam(p));
    error = error || '_error_' + id;
    this.actions.push([id, params, func, [output, error]]);
    return id;
  }

  /**
   * The observers are only run after the first dispatch call
   * @param argsAsStrings
   * @param observeFunc
   */
  observe(params, func) {
    const id = this.actions.length;
    params = params.map(p => parseParam(p));
    this.actions.push([id, params, func, []]);
    return id;
  }

  free(id) {
    const index = this.actions.findIndex(([actionId]) => actionId === id);
    return index >= 0 ? this.actions.splice(index, 1)[0] : undefined;
  }
}