import {JoiGraph} from "../../src/JoiGraph.js";

describe('JoiGraph.flatten .getParentPaths .orderedAssign', function () {

  const tree = {a: {x: 1}, b: {y: {"12": "something"}}};
  const test1 = {
    "start": {},
    "start/a": {},
    "start/a/x": 1,
    "start/b": {},
    "start/b/y": {},
    "start/b/y/12": "something"
  };
  it("JoiGraph.flatten slash start", function () {
    let flatTree = JoiGraph.flatten(tree, "/", "start");
    expect(flatTree).to.deep.equal(test1);
  });

  it("JoiGraph.flatten with null value", function () {
    const tree = {a: {x: 1}, b: {y: {"12": null}}};
    let flatTree = JoiGraph.flatten(tree, "/", "start");
    const test2 = Object.assign({}, test1, {"start/b/y/12": null});
    expect(flatTree).to.deep.equal(test2);
  });

  it("JoiGraph.flatten with undefined value", function () {
    const tree = {a: {x: 1}, b: {y: {"12": undefined}}};
    let flatTree = JoiGraph.flatten(tree, "/", "start");
    const test2 = Object.assign({}, test1, {"start/b/y/12": undefined});
    expect(flatTree).to.deep.equal(test2);
  });

  it("JoiGraph.flatten with {}", function () {
    const tree = {a: {x: 1}, b: {y: {"12": {}}}};
    let flatTree = JoiGraph.flatten(tree, "/", "start");
    const test2 = Object.assign({}, test1, {"start/b/y/12": {}});
    expect(flatTree).to.deep.equal(test2);
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
      "": {},
      "a": {},
      "a.aa": {},
      "a.aa.aaa": 111,
      "a.ab": 12,
      "a.ac": 13,
      "b": 2,
      "c": 3
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

  it("JoiGraph.orderedAssign", function () {
    const A = {a: 1, b: 2, c: 3};
    const B = {a: 11, d: 12, e: 13};
    const C = JoiGraph.orderedAssign(A, B);
    expect(C).to.deep.equal({a: 11, d: 12, e: 13, b: 2, c: 3});
    expect(["a", "d", "e", "b", "c"]).to.deep.equal(Object.keys(C));
  });
});