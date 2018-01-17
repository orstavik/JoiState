describe('JoiGraph.flatten & JoiGraph.getParentPaths', function () {

  it("JoiGraph.flatten slash start", function () {
    const tree = {a: {x: 1}, b: {y: {"12": "something"}}};
    let flatTree = JoiGraph.flatten(tree, "/","start");
    expect(flatTree).to.deep.equal({"start/a/x": 1, "start/b/y/12": "something"});
  });

  it("JoiGraph.flatten dot", function () {
    const tree = JoiGraph.make({
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
    let flatTree = JoiGraph.flatten(tree, ".");
    expect(flatTree).to.deep.equal({
      "a.aa.aaa" : 111,
      "a.ab" : 12,
      "a.ac" : 13,
      "b" : 2,
      "c" : 3
    });
  });

  it("JoiGraph.getParentPaths dot", function () {
    const paths = ["a.b.c", "a.d.e"];
    const parents = JoiGraph.getParentPaths(paths, ".");
    expect(parents).to.deep.equal(["a.b", "a", "a.d"]);
  });

  it("JoiGraph.getParentPaths slash", function () {
    const paths = ["a/b/c", "a/d/e"];
    const parents = JoiGraph.getParentPaths(paths, "/");
    expect(parents).to.deep.equal(["a/b", "a", "a/d"]);
  });
});