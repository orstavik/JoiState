describe('JoiGraph.filter', function () {

  const A = JoiGraph.make({
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

  it("JoiGraph.filter(A, {c: 3}), test excisting property, but same value", function () {
    const B = {c: 3};
    const C = JoiGraph.filterDeep(A,B);
    expect(C).to.deep.equal({
      a: {
        aa: {
          aaa: 111
        },
        ab: 12,
        ac: 13
      },
      b: 2
    });
  });

  it("JoiGraph.filter(A, {c: 4}), test excisting property, but different value", function () {
    const B = {c: 4};
    const C = JoiGraph.filterDeep(A,B);
    expect(C).to.deep.equal({
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
  });

  it("JoiGraph.filter(A, {a: {aa: {aaa: 111}}}), test excisting property, same object value", function () {
    const B = {a: {aa: {aaa: 111}}};
    const C = JoiGraph.filterDeep(A,B);
    expect(C).to.deep.equal({
      a: {
        ab: 12,
        ac: 13
      },
      b: 2,
      c: 3
    });
  });

  it("JoiGraph.filter(A, {c: undefined}), test values of undefined in B", function () {
    const B = {c: undefined};
    const C = JoiGraph.filterDeep(A,B);
    expect(C).to.deep.equal({
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
  });

  it("JoiGraph.filter({a: {}, b:2}, {c: undefined}), test that removing empty branches on A even though they are not filtered", function () {
    const A2 = {a: {}, b:2};
    const B = {c: undefined};
    const C = JoiGraph.filterDeep(A2,B);
    expect(C).to.deep.equal({
      // a: {},
      b: 2
    });
  });
});