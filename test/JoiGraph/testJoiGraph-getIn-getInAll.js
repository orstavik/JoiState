//todo getInAll
describe('JoiGraph.getIn && JoiGraph.getInAll', function () {

  it("JoiGraph.getIn(one, path), paths tests", function () {
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
    const tests = {
      "": one,
      "a": one.a,
      "a.aa": one.a.aa,
      "a.aa.aaa": one.a.aa.aaa,
      "b": one.b,
      "x": undefined,
      "a.x": undefined,
      ".": undefined
    };
    for (let test in tests) {
      let two = JoiGraph.getIn(one, test);
      expect(two).to.be.equal(tests[test]);
    }
  });

  it("JoiGraph.getInAll(one, paths), paths tests", function () {
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
    const tests = {
      "": one,
      "a": one.a,
      "a.aa": one.a.aa,
      "a.aa.aaa": one.a.aa.aaa,
      "b": one.b,
      "x": undefined,
      "a.x": undefined,
      ".": undefined
    };
    let two = JoiGraph.getInAll(one, tests);
    expect(two).to.deep.equal(tests);
  });


});