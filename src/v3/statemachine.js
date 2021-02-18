export class JoiStateResult {
  constructor(array) {
    this.results = array;
  }
}

//returns a Promise or a JoiStateResult.
function runFun(fun, args) {
  try {
    const res = fun(...args);
    if (res instanceof JoiStateResult)
      return res;
    if (!(res instanceof Promise))
      return new JoiStateResult([res]);
    let resolver;
    const promise = new Promise(r => resolver = r);
    res.then(v => resolver(new JoiStateResult([v])), e => resolver(new JoiStateResult([, e])));
    return promise;
  } catch (err) {
    return new JoiStateResult([, err]);
  }
}

//return undefined if not ready,
//return &&key for the first blocking &&param
//return [...args] if the arguments can be created
function paramsToArguments(params, state, frame) {
  const args = [];
  for (let i = 0; i < params.length; i++) {
    let p = params[i];
    if (!(p instanceof Object))
      args[i] = p;
    else if (p.op === 'ROOT')
      args[i] = state;
    else if (p.op === 'FRAME')   //todo missing declarations
      args[i] = {trace: makeTrace(frame), actions: frame.actions, declarations: frame.declarations};
    else if (p.op === 'EMPTY')
      ;//empty
    else if (p.op === '&&' && p.key in state)
      return '&&' + p.key;
    else if (p.op === '*' || p.key in state)
      p.op !== '&' && (args[i] = state[p.key]);
    else
      return;
  }
  return args;
}

function firstReadyAction(frame) {
  // for (let i = 0; i < frame.actions.length; i++) {
  //   let action = frame.actions[i];

  //1. filter out all the actions that has already been invoked
  const actions = frame.actions.filter(([id]) => !(id in frame.invocations));

  for (let action of actions) {
    let [id, params, fun, outputs] = action;
    //1. already invoked
    // if (id in frame.invocations)
    //   continue;

    //2. all the outputs are already filled, this function will not run.
    if (outputs.length && outputs.every(key => key in frame.state)) {
      frame.invocations[id] = {count: frame.count++, status: 'canceled'};
      // action.push(frame.count++);
      // action.push('canceled');
      continue;
    }

    const args = paramsToArguments(params, frame.state, frame);

    //3. all parameters are not ready
    if (args === undefined)
      continue;

    //4. &&blocking parameter
    if (typeof args === 'string') {
      frame.invocations[id] = {count: frame.count++, status: '&&', args};
      // action.push(frame.count++);
      // action.push('&&');
      // action.push(args);
    }
    //5. return next ready action with arguments
    else /*if (args instanceof Array)*/{
      frame.invocations[id] = {count: frame.count++, status: 'i', args};
      // action.push(frame.count++);
      // action.push('i');
      // action.push(args);
      return {action, args};
    }
  }
  //6. no more actions can be called at this point.
  return {};
}

function makeTrace({actions, invocations, resolutions}) {
  return actions.map(action => [...action, ...invocations[action[0]], ...resolutions[action[0]]]);
}

function setValue(frame, action, {results}) {
  let [id, p, f, outputs] = action;
  const outputState = [];
  for (let i = 0; i < outputs.length || i < results.length; i++) {
    let output = outputs[i];
    if (!(i in results)) {
      outputState[i] = 'u';
    } else if (output in frame.state) {
      outputState[i] = 'b';
    } else {
      frame.state[output] = results[i];
      outputState[i] = 'o';
    }
  }
  frame.resolutions[id] = {count: frame.count++, outputState, results};
  // action.push(frame.count++);
  // action.push(outputState);
  // action.push(results);
}

export function run(frame) {
  for (let {action, args} = firstReadyAction(frame); action; {action, args} = firstReadyAction(frame)) {
    // trace(frame);      //trace before invocation. state machine looses control //todo replace this with something else, if we need
    const result = runFun(action[2], args);
    if (result instanceof Promise) {
      action[5] += 'a';                           //add data for async invocation
      result.then(val => (setValue(frame, action, val), run(frame)));
    } else
      setValue(frame, action, result);
  }
  // trace(frame);        //trace before exit. state machine looses control
}