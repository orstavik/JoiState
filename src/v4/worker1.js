import {JoiStateResult} from "../v3/statemachine";

const link = "https://raw.githubusercontent.com/Halochkin/Cloudflare/master/StateManagement(TypingRacerApp)";
//todo add as global variable
let contentType;

function getCookieValue(cookie, key) {
  return cookie?.match(`(^|;)\\s*${key}\\s*=\\s*([^;]+)`)?.pop();
}

async function makeFetch(path) {
  return await fetch(link + path)
    .then(response => response.text())
    .then(data => data)
    .catch(error => console.error(error, " ", path + " blocked by brwoser"))
}

function getPath(request) {
  const url = new URL(request.url);
  return url.pathname;
}

function mineMime(path) {
  const segments = path.split('/');
  const last = segments[segments.length - 1];
  if (last === '')
    return 'text/html';
  const fileType = last.split('.')[1];
  if (!fileType)
    throw 'bad path: ' + path;
  if (fileType === 'js' || fileType === 'mjs')
    return 'application/javascript';
  if (fileType === 'html' || fileType === 'htm')
    return 'text/html';
  if (fileType === 'css')
    return 'text/css';
  throw 'unknown mimeType: ' + path;
}

function plus(...args) {
  let res = args[0];
  for (let i = 1; i < args.length; i++)
    res += args[i];
  return [res];
}

function makeHeader(status, contentType) {
  return {status: status, headers: {"Content-Type": contentType}};
}

async function getTextFromResponse(response) {
  return await response.text();
}

function makeResponse(body, header) {
  return new Response(body, header);
}

function makeErrorResponse(error) {
  return "404 Not found";
}

function get(obj, path) {
  if (!path)
    return obj;
  if (!(obj instanceof Object))
    throw new SyntaxError('The action "get" is given an illegal object: ' + typeof obj);
  if (typeof path !== 'string')
    throw new SyntaxError('The action "get" is given an illegal path: ' + typeof path);
  for (let segment of path.split('.')) {
    if (obj instanceof Headers || obj instanceof URLSearchParams)
      obj = obj[segment] || obj.get(segment);
    else
      obj = obj[segment];
  }
  return obj;
}

const actions = [
  [['request', '"headers.cookies"'], /*native*/ get, ['cookies']],
  [['cookies', '"sessionID"'], /*native*/ getCookieValue, ['sessionId', 'noSessionId']],

  [['request'], getPath, ['path', 'badUrl']],
  [['path'],  /*unit*/ /*native*/ mineMime, ['mimeType', 'badMimeType']],
  [['global.link', 'path'], plus, ['link']],
  [['link'], /*native*/fetch, ['file', 'notFoundError']],
  [[200, 'mimeType'], /*unit*/makeHeader, ['header']],
  [['file'], /*native*/getTextFromResponse, ['fileText', 'badFile']],
  [['fileText', 'header'], makeResponse, ['response']],

  //todo here we need to filter the inputs..
  //We also need to look inside the objects to get the content we need.
  [['request', 'response'], log, ['&badUrl' , '&badMimeType' , '&notFoundError' , '&badFile']],

  //here we have an OR input,
  [['badUrl' || 'badMimeType' || 'notFoundError' || 'badFile'], logError, []],
  [['badUrl' || 'badMimeType' || 'notFoundError' || 'badFile'], makeErrorResponse, ['response']],
];

//special case: if there are only optional arguments, then one of the optional arguments must be set in order to trigger the function.
//  [['*badUrl', '*badMimeType', '*notFoundError', '*badFile'], logError, []],

async function handleRequest(request) {

  try {
    const url = new URL(request.url);
    const path = url.pathname;
    // if (path) {
    let res = await makeFetch(path);

    const type = path.substr(path.lastIndexOf('.') + 1);
    //if .css/.img etc
    if (type === 'js')
      contentType = 'application/javascript';
    else
      contentType = 'text/' + type;

    if (type === "/")
      contentType = 'text/html';

    return new Response(res, {status: 200, headers: {"Content-Type": contentType}}); //'Referrer-Policy': 'unsafe-url',
  } catch (e) {
    return "404 Not found"
  }
}


addEventListener("fetch", e => {
  e.respondWith(handleRequest(e.request))
});