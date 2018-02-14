import {JoiGraph} from "../../src/JoiGraph.js";

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