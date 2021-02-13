import {JoiGraph} from "./JoiGraph.js";

const updatedRealTargets = new WeakMap();   //originalTarget => updateTarget (or the original target if not yet updated)

// here we need a weakMap from target => path => proxy, if not make .bob and remember .bob.
const alreadyMadeProxies = new WeakMap();

function getChildProxy(root, prop) {
  let previousProxies = alreadyMadeProxies.get(root);
  if (previousProxies && prop in previousProxies)
    return previousProxies[prop];
  !previousProxies && alreadyMadeProxies.set(root, previousProxies = {});
  return previousProxies[prop] = new Proxy({root: root, path: prop}, childProxyType);
}

const childProxyType = {
  set(target, prop, value) {
    const {path, root} = target;
    const dotProp = path ? path + '.' + prop : prop;
    const updatedRoot = updatedRealTargets.get(root) || root;
    const newRoot = JoiGraph.setIn(updatedRoot, dotProp, value);
    updatedRealTargets.set(root, newRoot);
    return value;
  },
  get(target, prop) {
    const {path, root} = target;
    const dotProp = path ? path + '.' + prop : prop;
    const updatedRoot = updatedRealTargets.get(root) || root;
    const updatedValue = JoiGraph.getIn(updatedRoot, dotProp);
    if (updatedValue === null || !(updatedValue instanceof Object || typeof updatedValue === 'object'))
      return updatedValue;
    return getChildProxy(root, dotProp);
  },
  has(target, prop) {
    const {path, root} = target;
    let updatedRoot = updatedRealTargets.get(root) || root;
    if(path){
      for (let seg of path.split('.')) {
        updatedRoot = updatedRoot[seg];
        if(updatedRoot === null || !(updatedRoot instanceof Object || typeof updatedRoot === 'object'))
          return false;
      }
    }
    return prop in updatedRoot;
  },
  deleteProperty(target, prop) {
    const {path, root} = target;
    const dotProp = path ? path + '.' + prop : prop;
    const updatedRoot = updatedRealTargets.get(root) || root;
    let newRoot = JoiGraph.deleteIn(updatedRoot, dotProp);
    newRoot === undefined && (newRoot = {}); //todo the deleteIn will clean up and replace with undefined, instead of with an empty object.
    updatedRealTargets.set(root, newRoot);
    return true; //todo always true?
  }
};

export function makeStateObject(obj){
  return new Proxy({root: obj, path: ''}, childProxyType);
}

export function getStateObject(obj){
  return updatedRealTargets.get(obj) || obj;
}