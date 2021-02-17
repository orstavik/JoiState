//returns either two Promises or either only success(not a Promise) or error (not a Promise)
function runFun(fun, args) {
  try {
    const res = fun(...args);
    if (!(res instanceof Promise))
      return {success: res};
    let successResolver, errorResolver;
    const success = new Promise(r => successResolver = r), error = new Promise(r => errorResolver = r);
    res.then(v => successResolver(v), e => errorResolver(e));
    return {success, error};
  } catch (err) {
    return {error: err};
  }
}

function firstReadyAction(frame) {
  main:for (let i = 0; i < frame.remainingActions.length; i++) {
    let action = frame.remainingActions[i];
    const args = [];
    for (let p of action[1]) {
      if (!(p instanceof Object))
        args.push(p);
      else if (p.op === '*' || p.key in frame.state)
        p.op !== '&' && args.push(frame.state[p.key]);
      else
        continue main;
    }
    frame.remainingActions.splice(i, 1);
    return {action, args};
  }
  return {};
}

function trace(frame, id, txt) {
  frame.trace.push([id, txt]);
  frame.onTrace && frame.onTrace(frame, txt);
}

function asyncActionReturns(frame, id, callTxt, key, val) {
  if (key in frame.state)
    return trace(frame, id, callTxt.toUpperCase());
  setValue(frame, id, callTxt, key, val);
  run(frame);
}

function setValue(frame, id, callTxt, key, val) {
  frame.state[key] = val;
  trace(frame, id, callTxt);
  //custom trace codes for ResponseRace machine. todo move this out to ResponseRace again as tracers that look for 'e' or 'o'
  if (key === 'response')
    trace(frame, id, 'r');
  if (key.startsWith('_observer') && !frame.remainingActions.filter(([i, p, f, out]) => out.startsWith('_observer')).length)
    trace(frame, id, 'l');
  //custom trace code for ResponseRace machine ends

  // frame.previousCalls[id].type = callTxt; //todo update the
  // frame.previousCalls[id].value = val;    //todo update the

  frame.remainingActions = frame.remainingActions.filter(([id, params, _, output]) => {
    if (output === key || params.find(({op, key: p}) => op === '&&' && p === key)) {
      trace(frame, id, `c`);
      return false;
    }
    return true;
  });
}


function tryToReuseValue(frame, action, args){
  const lastCall = frame.previousCalls[action[0]];
  for (let i = 0; i < args.length; i++) {
    let newArg = args[i];
    let previousArg = lastCall.args[i];
    if(newArg !== previousArg){
      frame.previousCalls[action[0]] = {args};
      return {};
    }
  }
  return {type: lastCall.type, value: lastCall.value};
}

export function run(frame) {
  for (let {action, args} = firstReadyAction(frame); action; {action, args} = firstReadyAction(frame)) {
    const [id, params, fun, output, error] = action;

    // const {type, value} = tryToReuseValue(frame, action, args); //todo
    // if(type){                                                   //todo
    //   frame.state[type === 'o' ? output : error] = value;       //todo
    //   trace(frame, id, 'reuse');                                //todo
    // }                                                           //todo

    trace(frame, id, `i`);             //we need to trace before invokation as the function might trigger an endless loop.
    const result = runFun(fun, args);
    if (result.success instanceof Promise) {
      trace(frame, id, 'a');
      result.success.then(val => asyncActionReturns(frame, id, `o`, output, val));
      result.error.then(val => asyncActionReturns(frame, id, `e`, error, val));
    } else if ('success' in result) {
      setValue(frame, id, 'o', output, result.success);
    } else /*if ('error' in result)*/ {
      setValue(frame, id, 'e', error, result.error);
    }
    if('abort' in frame.state) //todo hack making abort a reserved word..
      return;
  }
}