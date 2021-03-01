# WhatIs: an action?

1. An action takes set of input states and produce a set of output states.
2. All (regular) input states must be set.
3. The action chooses itself how many of its output states it will populate. Most often, an action will produce only one output state, the first.
4. If one of the (regular) output states is set, then the action will be canceled.
5. An output set can only be set once. If an async action resolves, and one of its output states has already been set (ie. is no longer unset as it was when the async action was invoked), then none of the return values will be set by the async action.

Example:

```
[dividend, divisor], divide, [quotient, error]
>
[1, 2], divide, [quotient=0.5]
[1, 0], divide, [quotient=NaN]
[1, 'bob'], divide, [ , error='TypeError: "bob" is not a valid divisor.']
```

`[1, 0], divide, [NaN]` could also choose to return the output as an Error.

## Optional arguments: `*arg`

If you want to run an action, even when one of its input states is unset, then use the *argument that parameter.

This is achieved using the following compilation. 
```
[*a, b, *c], fun, [d, e]
  =>
[a, b, c], fun, [d, e]
[a, b, unset], fun, [d, e]
[unset, b, c], fun, [d, e]
[unset, b, unset], fun, [d, e]
```

Example:

```
[a, b, *base], add, [sum, error]
>
[8,8,2], add, [sum=10000]
[8,8], add, [sum=16]
[8,unset,2], add, [unset, unset]  
    //this action is still not invoked. It will not be invoked until b is ready. 
```

## Dependency arguments: `&arg`

A dependency argument is an argument that the action must wait until is set before it can run, but the `&arg` itself is not passed to the action function. 

If you want an action not to run before a certain input state is set, but you do not want to pass that input state into the action function, then prefix the argument with `&`.

This is achieved using the following compilation.
```
[&a, b, c], fun, [d, e]
  =>
[a, b, c], rename, [_renamed_a, _renamed_b, _renamed_c]
[_renamed_b, _renamed_c], fun, [d, e]
```

Example:

```
[&response, text], heavyPostProduction, [parsedText, error_post_prod]
>
['abc'], heavyPostProduction, [parsedText='aAbBcC']
```

## Optional output: `*output`

> `*` = optional. The action will still run if the argument is missing; the action will still run and update *its other outputs* even when an optional output has been set.

If you want to invoke and set the results from an action, even when one of its output states has already set, then you must mark this output state as optional with the prefix `*`.

This is achieved using the following compilation.
```
[a, b, c], fun, [*d, e]
  =>
[a, b, c], fun, [d, e]
[a, b, c], fun, [_action_id_ignore, e]
```

Example: functions that can do text calculations.

```
[one, two], divide, [quotient, *error]
[three, four], multiply, [product, *error]
>
['four', 'zero'], divide, [quotient=unset, error='"zero" is not a valid divisor']
['tres', 'quatro'], multiply, [product='doce']
```

## Dependency output: `&output`

> `&` = dependency. The action will not run if the dependency argument is missing, or if the dependency output is set, but it will not use the dependency as neither output nor input.

If you want to prevent an action from running if a specific state is set, then add that state at the end of the output list as a dependency output: `&output`.

This is achieved using the following compilation.
```
[a, b, c], fun, [d, &e]
  =>
[a, b, c], rename, [_rename_a, _rename_b, _rename_c, e]
[_rename_a, _rename_b, _rename_c], fun, [d]
```

## Usecase !cache:

1. Store the last result of a function given the same arguments.

```
[...args], !FunName, [...outputs]
=>
[funName,...args], CacheOut,[...outputs, cacheComplete]
[&&cacheComplete, ...args], FunName, [...tmpOutputs]
[&&cacheComplete, funName, ...args, ...tmpOutputs], CacheIn, []
[&&cacheComplete, ...tmpOutputs], set, [...outputs]
```

This can be backed up by a lru cache, and will work well as a means to remember invocations. If this is applied by default to observers and/or computers, they will not run next time if their value is the same as the last time.

## Usecase #reuse:

We wish to make as few changes in the output objects as possible. We need to take the current output and try to reuse any objects/arrays that is identical with the previous entity.

```
[...args], #fun, [...outputs]
=>
[... Args], Fun, [...tmpOutputs]
[...tmpOutputs], Reuse, [...outputs]
```

The reuse function will remember only the last outputs it saw. This can be adjusted, to remember a bunch of objects, but that might be more costly.

The usecases cache+reuse should cover the need for minimal change, and then by using the cache function on both observers and computers, the only call on change occurs.


## Usecase @utomatic unit tests:

We need to access the function text from the operator function. A functions[funName] that returns a textual description of the text must be made available.

```
[...args], @Fun, [...outputs]
=>
[...args], Fun, [...outputs, funHasRunID]
[&funHasRunID, "fun", 3,...args,...outputs], UnitTest, []
```

The "fun" is the name of the function which can be used to get the source of the function. The number 3 is the argument count. From this a unit test object can be made.

@ can be used to make unit test for functions that return a JoiStateResult obj.

The unit test function can keep a cache of previous results, so not to post tests to server redundantly. Then, the test is posted to a url. This web server will save all tests as orange. Then you go in, review them, and mark them green or red.

To create the unit test, the unitTest function needs: 
1. The input parameters. These should be Json-able.
2. The outputs. These should be Json-able.
3. The import statement for the function. This import statement should uniquely identify the function, and give the user a good overview of it. The funName in the action is not useful, only the import statement is useful here. 

## Usecase ML:

You have a function that gets in a set of parameters and then need to guess an output.

```
[$a,$b,c,d], $fun, [e, f]
=>
[&&e, &&f, "fun", a, b, c, d], learn, []
[a, b, c, d], set, [e, f] //simply set a, b as e, f
["fun", *a, *b, c, d], guess, [e, f]
```

Note, the function name is here only a place holder. It will be used by the guessing function to separate different ml actions, but can also be used to connect them.

The learn functions will pass the data to either a server or a function in the browser, that will train a function. The guess function will retrieve the trained function and apply it.

## Usecase deepfreeze:

we want one or more output states from an action to be frozen. 

```
[a], ¤fun, [¤b, c]
=>
[a], fun, [_b_temp, c]
[_b_temp], deepFreeze, [b]
```

## Usecase verify mutations:


## Usecase Log:

    1. Log a set of properties of the state using an action. Use &params to control timing. Log(x, y, & z)

    2. Log each state change. Impossible. Must be done by adding different log action for different states.

You need to log the state of the machine. What you usually need here is:
1. the states that you desire to log
2. the situation in the actions list. The actionslist with the trace.
3. You could also include the declarations. If you do so, then automatic unit tests could be produced by the log alone.

We would like to do logging when certain states occur. If there is an error, then we would like to log that error. When the response is sent, then we would like to call a log, and when all the observers are sent, then we would like to make a log.

We would also like to filter these states, and that we do as regular state filters. We check an equals or something else in the state to reduce the number of states that are called. This is simple enough to do with normal state filtering mechanisms. This makes monitoring a slice of all interactions much simpler.

So, the logging is essentially a property on the output states. We need to listen for certain output states to occur:
1. some of these output states are really important, they must be logged at once.
2. some of these output states are less important, they should all be triggered, but then logged later.

When we log a function, we need all the input states, and the desired output states. With this information, we can generate unit tests, and ml.

So, we then get the machine learning and auto unit test background.


But, we would like to send out these logs as few times as possible (not 5 times per request, but only 1 if possible). And we would like these logs to be sent out safely, so that no timeout will prevent them from occuring.


The log is a state snapshot. A selection of the state. These snapshots might be necessary to do at different times, just to be sure we get them, but if we know we have time, or if we don't care if it is done late, we can do it as just an observer.

```
 // usecase: we need to log fun when it returns d, or e, but not f.
 //          state 'e' is critical, and so that will get its own snapshot(write)
 //          'd' is not critical, so that will just accumulate.
  
[a,b,c], |fun, [|d,||e,f] 
=>
[a,b,c], fun, [d,e,f]
["funId", a, b, c, e], logNow
["funId", a, b, c, d], logLast
```

The problem is that the

When we add an output state to the snapshot, we need the input states of the action too. And then we can collate the snapshots. However, if we collate lots of snapshots, and some of the parameters cannot be fulfilled, then we need to know about that. So, we need