import {run} from "./statemachine.js";
import {BUILTIN, compile, parseParam, reuse} from "./compiler.js";

// function deepFreeze(obj) {
//   if (typeof obj !== 'object' || obj === null)
//     return;
//   Object.freeze(obj);
//   for (let val in Object.values(obj))
//     deepFreeze(val);
// }
//
//todo do we observe cycle, or do we observe change?
// we observe change, and so we must dirtycheck all the properties to see if the arguments are the same as last time.
// if we want to observe cycle, then we add NaN as a fixed parameter, as NaN === NaN => trick

export class JoiStore {

  constructor(initialState = {}, actionsIn = [], declarations = {}) {
    //compile and link up the actions coming in
    //todo actions should be a map with keys, not an array with numbers. as the actions id are now different.
    //todo the keys can then be sorted alphabetically/numerically
    let {actions, declarations: primitives} = compile(actionsIn); //throw if compiler or linking error
    declarations = Object.assign(declarations, primitives, BUILTIN);
    actions.forEach(action => action[2] = declarations[action[2]]);  //link up functions in actions   //todo what is the threshold for ready?
    this.actions = actions;

    // deepFreeze(initialState);                            //todo how do we want to handle the deepFreeze?
    this.state = this.reducedState = initialState;
    this.lock = false;
    this.queue = [];
  }

  async reduce(propName, newValue) {
    this.queue.push([propName, newValue]);
    if (this.lock)
      return;
    this.lock = true;

    while (this.queue.length) {
      let [propName, newValue] = this.queue.shift();

      newValue = reuse(newValue, this.reducedState[propName]);
      if(newValue === this.reducedState[propName])
        continue;
      // deepFreeze(newValue);
      this.reducedState = Object.assign({}, this.reducedState);
      this.reducedState[propName] = newValue;
      const nextState = Object.assign({}, this.reducedState);

      //todo how to add declarations to the frame? i somehow need to add the ready check when the actions are compiled

      run({actions: this.actions, state: nextState, count: 0, invocations: {}, resolutions: {}, declarations: {}});
      this.state = nextState;
      // if (nextState._ready instanceof Promise)          //if this is an async statemachine, then await
      //   nextState._ready = await nextState._ready;      //todo here we are doing await..
      // deepFreeze(this.state);   //todo should we do this?? to lock the state for future promise returns?
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

  free(id) {           //unregister an action from the actions registry.
    const index = this.actions.findIndex(([actionId]) => actionId.startsWith(id));
    return index >= 0 ? this.actions.splice(index, 1)[0] : undefined;
  }
}