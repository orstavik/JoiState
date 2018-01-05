//  problem with mutability occurs with a) big, distributed, many different files all working against the same data
//  problem with mutability occurs with b) async, different parts of app need to wait for other parts of app to both write to the same properties.
describe('test of immutable function', function () {

  it("normal, mutable property setter ", function () {
    let a = {};
    a.child = "hello";
    let firstState = a.child;
    let firstPointer = a;

    a.child = "goodbye";
    let secondState = a.child;
    let secondPointer = a;

    expect(secondState).to.be.equal("goodbye");
    expect(firstState).to.be.equal("hello");
    expect(firstPointer).to.be.equal(secondPointer);
    expect(a.child).to.be.equal("goodbye");
    expect(a).to.be.equal(a);
  });

  it("JoiPath.setIn, changing child property", function () {
    let a = {};
    a.child = "hello";
    let firstState = a.child;
    let firstPointer = a;
    let b = JoiPath.setIn(a, ["child"], "goodbye");
    let secondState = b.child;
    let secondPointer = b;

    expect(secondState).to.be.equal("goodbye");
    expect(firstState).to.be.equal("hello");
    expect(firstPointer).to.not.equal(secondPointer);
    expect(a.child).to.be.equal("hello");
    expect(b.child).to.be.equal("goodbye");
    expect(a).to.not.equal(b);
  });

  it('JoiPath.setIn, making no changes to child', function () {
    let a = {};
    a.child = "hello";

    let firstState = a.child;
    let firstPointer = a;

    let b = JoiPath.setIn(a, ["child"], "hello");
    let secondState = b.child;
    let secondPointer = b;

    expect(secondState).to.be.equal("hello");
    expect(firstState).to.be.equal("hello");
    expect(firstPointer).to.be.equal(secondPointer);
    expect(a.child).to.be.equal("hello");
    expect(b.child).to.be.equal("hello");
    expect(a).to.be.equal(b);
  });

  it('JoiPath.setIn, sibling remain the same object', function () {
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

    expect(firstPointer).to.not.equal(secondPointer);
    expect(firstPointerChild1).to.not.equal(secondPointerChild1);
    expect(firstPointerChild2).to.be.equal(secondPointerChild2);
    expect(a.child1).to.not.equal(b.child1);
    expect(a.child2).to.be.equal(b.child2);
  });
});
