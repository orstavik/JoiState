//example start
let a = {};
a.child = "hello";

let firstState = a.child;
let firstPointer = a;

a.child = "goodbye";
let secondState = a.child;
let secondPointer = a;

secondState === "goodbye";      //true
firstState === "hello";         //true
firstPointer === secondPointer; //true
a.child === "goodbye";          //true

a === a; //true

//  problem with mutability occurs with a) big, distributed, many different files all working against the same data
//  problem with mutability occurs with b) async, different parts of app need to wait for other parts of app to both write to the same properties.
//example end

//example immutable using JoiPath
{
  let a = {};
  a.child = "hello";

  let firstState = a.child;
  let firstPointer = a;

  let b = JoiPath.setIn(a, ["child"], "goodbye");
  let secondState = b.child;
  let secondPointer = b;

  secondState === "goodbye";      //true
  firstState === "hello";         //true
  firstPointer !== secondPointer; //true
  a.child === "hello";          //true
  b.child === "goodbye";          //true

  a !== b; //true
}
//example end

//example immutable using JoiPath with same value
{
  let a = {};
  a.child = "hello";

  let firstState = a.child;
  let firstPointer = a;

  let b = JoiPath.setIn(a, ["child"], "hello");
  let secondState = b.child;
  let secondPointer = b;

  secondState === "hello";      //true
  firstState === "hello";         //true
  firstPointer === secondPointer; //true
  a.child === "hello";          //true
  b.child === "hello";          //true

  a === b; //true
}
//example end

//example immutable using JoiPath with branches
{
  let a = {};
  a.child1 = {};
  a.child2 = {};
  a.child1.msg = "yes";
  a.child2.msg = "da";

  let firstPointer = a;
  let firstPointerChild1 = a.child1;
  let firstPointerChild2 = a.child2;

  let b = JoiPath.setIn(a, ["child1", "msg"], "ja");

  let secondPointer = b;
  let secondPointerChild1 = b.child1;
  let secondPointerChild2 = b.child2;

  firstPointer !== secondPointer; //true
  firstPointerChild1 !== secondPointerChild1; //true
  firstPointerChild2 === secondPointerChild2; //true

  a.child1 !== b.child1
  a.child2 === b.child2

}
//example end