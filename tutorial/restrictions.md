

## Rules:

1. Only one reducer can run per microtask.

2. When a reducer has run, and potentially changed the state, then
   1. first, all the computers will be checked/run,
   2. second, all the observers will be checked/run.

3. This means that if one of the computers, or one of the observers, directly (or indirectly) trigger a reducer sync, this will cause an ReducerLoopError.
   
4. Whenever an Error occurs during the execution of a computer or an observer occurs, the Error will be added to the state, and then all the remaining computers and observers that do not rely on this computed property as an argument will continue to run. All computers and observers that rely on this computed property, will be cancelled and not triggered.

5. Computers must be sync functions. Async functions cannot be computers. If a computer returns a Promise, this Promise will be considered an Error.

6.  All properties on the main state object that are created/changed by an reducer, must start with a letter character; all properties on the main state object that are created/changed by a computer, must start with underscore `_`.

7. The main state object is deep frozen before any of its properties are passed to the computers/observers. This means that computers/observers cannot mutate the state as a biproduct.


## Why should we have these rules? and what are the drawbacks of these rules?

We only want reducers (and the state that the reducers produce) to react to/reflect externally driven data. Examples of externally driven data is output from UI events, database data, or text fetched from a network. 

Such data coming in to the system, must be queued and handled individually. You do not want the processing of such data from two different sources to intermingle. That could cause major headaches.

This means that data internally produced by the app must be completed before you start processing the next external source. Thus, we use the microtask queue as this border. The data that are considered internal is produced sync, ie. within the same micro task.

## The running of computers

In principle, computed properties are emptied and then recalculated anew every time a reducer changes the state. However, in practice, and to save computation, the output of a computer is cached, and if no value of the arguments of the computer function has changed, the previous, cached result will be used.

This also applies to observers. If all the arguments of an observer are the same as they were the last time the observer were invoked, then the observer will not be invoked again.  



If a computer throws an error during execution, it will not call any other computer who rely on that input for its functionality.
