describe('test of JoiGraph.make', function () {
  it("JoiGraph.make()", function () {
    const a = JoiGraph.make();
    const b = JoiGraph.make({});
    const c = JoiGraph.make({a: 1});
    expect(Object.keys(a).length).to.be.equal(0);
    expect(Object.keys(b).length).to.be.equal(0);
    expect(Object.keys(c).length).to.be.equal(1);
    expect(c.a).to.be.equal(1);
  });
});

describe('test of JoiGraph.equals', function () {
  const deleteTests = [undefined, Object.create(null, {}), {}];
  const one = JoiGraph.make({
    a: {
      aa: {
        aaa: 111
      },
      ab: 12,
      ac: 13
    },
    b: 2,
    c: 3
  });

  it("JoiGraph.equals(one,X)", function () {
    let match = JoiGraph.equals(one, one);
    expect(match).to.be.true;
    match = JoiGraph.equals(one.b, 2);
    expect(match).to.be.true;
    match = JoiGraph.equals(one.a, {
      aa: {
        aaa: 111
      },
      ab: 12,
      ac: 13
    });
    expect(match).to.be.true;
  });
});


describe('test of JoiGraph.setIn', function () {

  const deleteTests = [undefined, Object.create(null, {}), {}];
  const differentTests = ["hello", {aba: 121}, null, console.log]; //Console.log is just a pointer to a function
  const one = JoiGraph.make({
    a: {
      aa: {
        aaa: 111
      },
      ab: 12,
      ac: 13
    },
    b: 2,
    c: 3
  });

  it("JoiGraph.setIn(one, path, value), equal or deep equal values", function () {
    let two = JoiGraph.setIn(one, "a.ab", 12);
    expect(one).to.be.equal(two);
    two = JoiGraph.setIn(one, "a.aa.aaa", 111);
    expect(one).to.be.equal(two);
    two = JoiGraph.setIn(one, "a.aa", {aaa: 111});
    expect(one).to.be.equal(two);
    two = JoiGraph.setIn(one, "a", {aa: {aaa: 111}, ab: 12, ac: 13});
    expect(one).to.be.equal(two);
  });

  it("JoiGraph.setIn(one, 'a.ab', values), different values", function () {
    for (let test of differentTests) {
      let two = JoiGraph.setIn(one, "a.ab", test);
      expect(one).to.not.equal(two);
      expect(one.a).to.not.equal(two.a);
      expect(one.a.ab).to.not.equal(two.a.ab);

      expect(one.a.aa).to.be.equal(two.a.aa);
      expect(one.a.ac).to.be.equal(two.a.ac);
      expect(one.b).to.be.equal(two.b);
      expect(one.c).to.be.equal(two.c);
    }
  });

  it("JoiGraph.setIn(one, 'a.aa.aaa', values), different values", function () {
    for (let test of differentTests) {
      let two = JoiGraph.setIn(one, "a.aa.aaa", test);
      expect(one).to.not.equal(two);
      expect(one.a).to.not.equal(two.a);
      expect(one.a.aa).to.not.equal(two.a.aa);

      expect(one.a.ab).to.be.equal(two.a.ab);
      expect(one.b).to.be.equal(two.b);
      expect(one.c).to.be.equal(two.c);
    }
  });

  it("JoiGraph.setIn(one, 'a', {aa: {aaa: 111}}), should miss the ab- and ac-branches", function () {
    let two = JoiGraph.setIn(one, 'a', {aa: {aaa: 111}});
    expect(one).to.not.equal(two);
    expect(one.a).to.not.equal(two.a);
    expect(two.a).to.not.have.property("ab");
    expect(two.a).to.not.have.property("ac");
    expect(one.b).to.be.equal(two.b);
  });

  it("JoiGraph.setIn(one, path, undefined/{}), branches should be missing", function () {
    for (let test of deleteTests) {
      let two = JoiGraph.setIn(one, "a.aa.aaa", test);
      expect(one).to.not.equal(two);
      expect(one.a).to.not.equal(two.a);
      expect(two.a).to.not.have.property("aa");   //since "aa" only has one child, it should be removed
      expect(one.a.ab).to.be.equal(two.a.ab);
      expect(one.b).to.be.equal(two.b);


      two = JoiGraph.setIn(one, "a.aa", test);
      expect(one).to.not.equal(two);
      expect(one.a).to.not.equal(two.a);
      expect(two.a).to.not.have.property("aa");
      expect(one.a.ab).to.be.equal(two.a.ab);
      expect(one.b).to.be.equal(two.b);

      two = JoiGraph.setIn(one, "a", test);
      expect(one).to.not.equal(two);
      expect(two).to.not.have.property("a");
      expect(one.b).to.be.equal(two.b);
    }
  });

  it("JoiGraph.setIn(one, unknownPath, undefined/{}), deleting outside scope, should return the same object", function () {
    for (let test of deleteTests) {
      let two = JoiGraph.setIn(one, "d", test);
      expect(one).to.be.equal(two);
      two = JoiGraph.setIn(one, "a.d", test);
      expect(one).to.be.equal(two);
    }
  });

  it("JoiGraph.setIn(one, unknownPath, differentValue), adding outside scope, should return new object", function () {
    for (let test of differentTests) {
      let two = JoiGraph.setIn(one, "d", test);
      expect(one).to.not.equal(two);
      expect(test).to.be.equal(two.d);
      expect(one.a).to.be.equal(two.a);
      two = JoiGraph.setIn(one, "a.ad", test);
      expect(one).to.not.equal(two);
      expect(one.a).to.not.equal(two.a);
      expect(one.b).to.be.equal(two.b);
      expect(test).to.be.equal(two.a.ad);
      two = JoiGraph.setIn(one, "a.aa.aad", test);
      expect(one).to.not.equal(two);
      expect(one.a).to.not.equal(two.a);
      expect(one.b).to.be.equal(two.b);
      expect(one.a.aa).to.not.equal(two.a.aa);
      expect(one.a.ab).to.be.equal(two.a.ab);
      expect(test).to.be.equal(two.a.aa.aad);
    }
  });


});

//  problem with mutability occurs with a) big, distributed, many different files all working against the same data
//  problem with mutability occurs with b) async, different parts of app need to wait for other parts of app to both write to the same properties.
/*
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
*/
