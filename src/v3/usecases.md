## Usecase Log:

1. Log a set of properties of the state using an action. Use &params to control timing. Log(x, y, & z)
   
2. Log each state change. Impossible. Must be done by adding different log action for different states.

## Usecase cache:

1. Store the last result of a function given the same arguments.

```
!FunName(...args)[...outputs]
=>
CacheOut(funName,...args)[...outputs, cacheComplete]
FunName(&&cacheComplete, ...args)[...tmpOutputs]
CacheIn(&&cacheComplete, funName, ...args, ...tmpOutputs) []
set(&&cacheComplete, ...tmpOutputs)[...outputs]
```

This can be backed up by a lru cache, and will work well as a means to remember invocations. If this is applied by default to observers and/or computers, they will not run next time if their value is the same as the last time.

## Usecase #reuse:

We wish to make as few changes in the output objects as possible. We need to take the current output and try to reuse any objects/arrays that is identical with the previous entity.

```
#fun(...args)[...outputs]
=>
Fun(... Args)[...tmpOutputs]
Reuse(...tmpOutputs) [...outputs]
```

The reuse function will remember only the last outputs it saw. This can be adjusted, to remember a bunch of objects, but that might be more costly.

The usecases cache+reuse should cover the need for minimal change, and then by using the cache function on both observers and computers, the only call on change occurs.


## Usecase automatic unit tests :

We need to access the function text from the operator function. A functions[funName] that returns a textual description of the text must be made available.

```
@Fun(...args)[...outputs]
=>
Fun(...args) [...outputs, funHasRunID]
UnitTest(&funHasRunID, "fun", 3,...args,...outputs).
```

The "fun" is the name of the function which can be used to get the source of the function. The number 3 is the argument count. From this a unit test object can be made.

@@ can be used to make unit test for functions that return a JoiStateResult obj.

The unit test function can keep a cache of previous results, so not to post tests to server redundantly. Then, the test is posted to a url. This web server will save all tests as orange. Then you go in, review them, and mark them green or red.

## Usecase ML:
You have a function that gets in a set of parameters and then need to guess an output.

```
$fun($a,$b,c,d)[e, f]
=>
learn(&&e, &&f, "fun", a, b, c, d)
set(a, b, c, d) [e, f] //simply set a, b as e, f
guess("fun", *a, *b, c, d) [e, f]
```

Note, the function name is here only a place holder. It will be used by the guessing function to separate different ml actions, but can also be used to connect them.

The learn functions will pass the data to either a server or a function in the browser, that will train a function. The guess function will retrieve the trained function and apply it.
