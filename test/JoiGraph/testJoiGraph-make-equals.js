describe('JoiGraph.make .equals .equalsShallow', function () {
  it("JoiGraph.make()", function () {
    const a = JoiGraph.make();
    expect(Object.keys(a).length).to.be.equal(0);

    const b = JoiGraph.make({});
    expect(Object.keys(b).length).to.be.equal(0);

    const c = JoiGraph.make({a: 1});
    expect(Object.keys(c).length).to.be.equal(1);
    expect(c.a).to.be.equal(1);
  });

  it("JoiGraph.equals(one,X)", function () {
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
    assert(JoiGraph.equals(one, one));
    assert(JoiGraph.equals(one.b, 2));
    assert(JoiGraph.equals(one.a, {
      aa: {
        aaa: 111
      },
      ab: 12,
      ac: 13
    }));
  });

  it("JoiGraph.equalsShallow(one,X)", function () {
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
    assert(JoiGraph.equalsShallow(one, one));
    assert(!JoiGraph.equalsShallow(one.b, 5));
    assert(JoiGraph.equalsShallow(one.b, 2));
    assert(JoiGraph.equalsShallow(one.a, {
      aa: {
        aaa: 333
      },
      ab: null,
      ac: undefined
    }));
    assert(!JoiGraph.equalsShallow(one.a, {
      aa: {
        aaa: 333
      },
      ac: undefined
    }));
    assert(!JoiGraph.equalsShallow(one.a, {
      aa: {
        aaa: 333
      },
      ab: null,
      ac: undefined,
      ad: 333
    }));
  });
});