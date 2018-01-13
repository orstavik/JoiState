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