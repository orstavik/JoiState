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

describe('JoiGraph.mergeDeep: No changes', function () {

  //merge B, result
  const tests = [
    [one, one, "one", "one"],
    [{b: 2}, one, "{b: 2}", "one"],
    [{b: 2}, one, "{a: aa: {aaa: 111}}", "one"],
  ];
  for (let test of tests) {
    it(`JoiGraph.mergeDeep(one, ${test[2]}) === ${test[3]}`, function () {
      let two = JoiGraph.mergeDeepWithNullToDelete(one, test[0]);
      expect(test[1]).to.be.equal(two);
    });
  }
});

describe('JoiGraph.mergeDeep: Partial changes', function () {

  it("JoiGraph.mergeDeep(one, {a: 1}) === {a:1,b:2,c:3}. a changes, b and c no change", function () {
    let two = JoiGraph.mergeDeepWithNullToDelete(one, {a: 1});
    expect({a: 1, b: 2, c: 3}).to.deep.equal(two);
  });

  it("JoiGraph.mergeDeep(one, {a: {ab: 0}}). ab, a, one. Others no change.", function () {
    let two = JoiGraph.mergeDeepWithNullToDelete(one, {a: {ab: 0}});
    expect({
      a: {
        aa: {
          aaa: 111
        },
        ab: 0,
        ac: 13
      },
      b: 2,
      c: 3
    }).to.deep.equal(two);
    expect(one.a.aa).to.be.equal(two.a.aa);
    expect(one).to.not.equal(two);
    expect(one.a).to.not.equal(two.a);
  });
});

describe('JoiGraph.mergeDeep: null to delete', function () {

  it("JoiGraph.mergeDeep(one, {a: null}) === {b:2,c:3}. Deleted a. Changed one. No change b and c", function () {
    let two = JoiGraph.mergeDeepWithNullToDelete(one, {a: null});
    expect({b: 2, c: 3}).to.deep.equal(two);
    expect(two).to.not.have.property("a");
    expect(one).to.not.equal(two);
  });

  it("JoiGraph.mergeDeep(one, {a: {ab: null}}). Deleted a.ab. Changed a, one. No change others.", function () {
    let two = JoiGraph.mergeDeepWithNullToDelete(one, {a: {ab: null}});
    expect({
      a: {
        aa: {
          aaa: 111
        },
        ac: 13
      },
      b: 2,
      c: 3
    }).to.deep.equal(two);
    expect(two.a).to.not.have.property("ab");
    expect(one.a.aa).to.be.equal(two.a.aa);
    expect(one).to.not.equal(two);
    expect(one.a).to.not.equal(two.a);
  });
});
