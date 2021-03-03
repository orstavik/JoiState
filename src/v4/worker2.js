const myDomain = `typing-app.maksgalochkin2.workers.dev`;

const headers = {
  "Access-Control-Allow-Origin": "https://github-proxy.maksgalochkin2.workers.dev",
  'Content-Type': 'application/json',
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE"
};

const allowedActions = [
  'json',
  'getsessions',
  'delete'
]


function getCookieValue(cookie, key) {
  return cookie?.match(`(^|;)\\s*${key}\\s*=\\s*([^;]+)`)?.pop();
}

let cachedPassHash;

async function passHash(pw) {
  return cachedPassHash || (cachedPassHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw)));
}

function hexStringToUint8(str) {
  return new Uint8Array(str.match(/.{2}/g).map(byte => parseInt(byte, 16)));
}

function fromBase64url(base64urlStr) {
  base64urlStr = base64urlStr.replace(/-/g, '+').replace(/_/g, '/');
  if (base64urlStr.length % 4 === 2)
    return base64urlStr + '==';
  if (base64urlStr.length % 4 === 3)
    return base64urlStr + '=';
  return base64urlStr;
}

async function makeKeyAESGCM(password, iv) {
  const pwHash = await passHash(password);
  const alg = {name: 'AES-GCM', iv: iv};                            // specify algorithm to use
  return await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt', 'encrypt']);  // use pw to generate key
}

async function decryptAESGCM(password, iv, ctStr) {
  const key = await makeKeyAESGCM(password, iv);
  const ctUint8 = new Uint8Array(ctStr.match(/[\s\S]/g).map(ch => ch.charCodeAt(0))); // ciphertext as Uint8Array
  const plainBuffer = await crypto.subtle.decrypt({name: key.algorithm.name, iv: iv}, key, ctUint8);                 // decrypt ciphertext using key
  return new TextDecoder().decode(plainBuffer);                                       // return the plaintext
}


async function decryptData(data, password) {
  try {
    const [ivText, cipherB64url] = data.split('.');
    const iv = hexStringToUint8(ivText);
    const cipher = atob(fromBase64url(cipherB64url));
    const payload = await decryptAESGCM(password, iv, cipher);
    return payload;
  } catch (err) {
    throw 'error decrypting: ' + data;
  }
}


function getPath(request) {
  const url = new URL(request.url);
  return url.pathname;
}


async function unwrapJwtCookie(jwtCookie) {
  if (!jwtCookie)
    return "";
  const jwtObj = JSON.parse(atob(fromBase64url(jwtCookie)));
  if (!jwtObj)
    throw "Cant decode cookie"
  return jwtObj;
}

async function decryptJwt(jwtObj, SECRET) {
  const decryptedPayloadAwait = await decryptData(jwtObj.header.iv + "." + jwtObj.payload, SECRET);
  if (!decryptedPayloadAwait)
    throw "JWT cant be decrypted, someone try to hack us!!!"
  return "_" + JSON.parse(decryptedPayloadAwait).uid;
}

function getAction(path) {
  const segments = path.split('/');
  const action = segments[segments.length - 1];  //check actions?
  if (allowedActions.includes("action"))
    return action;
  else
    throw 'Unknown action: ' + path;  //todo: make response or throw an error?
}


async function observeUserSession(userID, request, PREVIOUS_RESULTS) {
  let session = await request.json();
  const sessionId = userID + "-" + session.sessionId;
  await PREVIOUS_RESULTS.put(sessionId, JSON.stringify(session));
}

async function getRequestJson(request) {
  return await request.json();
}

function makeJsonResponseBody(userID) {
  return {userIsLogged: !!userID, uId: userID};
}

function makeResponse(bodyObj, headers) {
  return new Response(JSON.stringify(bodyObj), {headers})
}

function getHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://github-proxy.maksgalochkin2.workers.dev",
    'Content-Type': 'application/json',
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE"
  };
}

async function doGetsessions(userID, PREVIOUS_RESULTS) {
  const values = await PREVIOUS_RESULTS.list();
  const res = [];
  for (let key of values.keys) {
    if (key && key.name.startsWith(userID))
      res.push(await PREVIOUS_RESULTS.get(key.name));
  }
  return res;
}

function equals(test, ...conditions) {
  const res = [];
  let hasMatch = false;
  for (let i = 0; i < conditions.length; i++) {
    if (i in conditions && conditions[i] === test)
      hasMatch = (res[i] = conditions[i]), true;
  }
  res[res.length] = hasMatch;
  return res;
}

// [[5, 6, 7, 5, 2, 9], biggerThan, ['six', 'seven', 'five', 'two', 'nine', 'none']],
//                                  [ true,    true,       ,      ,   true,       ]],
function biggerThan(test, ...conditions) {
  const res = [];
  let hasMatch = false;
  for (let i = 0; i < conditions.length; i++) {
    if (i in conditions && conditions[i] > test)
      hasMatch = (res[i] = true), true;
  }
  res[res.length] = hasMatch;
  return res;
}

function get(obj, segments) {
  if (segments === '')
    return obj;
  if (!(typeof segments === "string" || segments instanceof String))
    throw new SyntaxError('The action get must have a string as its second argument');
  for (let seg of segments.split('.')) {
    if (obj === null || !(obj instanceof Object))
      return undefined;
    obj = obj[seg];
  }
  return obj;
}

async function doDelete(request, PREVIOUS_RESULTS) {
  try {
    const json = await request.json();//todo
    //two different errors, should be handled in the state..
    await PREVIOUS_RESULTS.delete(json.key);
    return JSON.stringify({deleted: json.key});
  } catch (err) {
    return JSON.stringify({
      deleted: false,
      error: err.message
    });
  }
}

const actions = [
  [[], getHeaders, ['headers']],
  [['request'], getPath, ['path', 'badUrl']],
  [['path'], getAction, ['action', 'badAction']],

  [['action', '"json"', '"delete"', '"getsessions"'], equals, ['doJson', 'doDelete', 'doGetsessions', 'invalidAction']],

  [['&doJson'], getRequestJson, ['requestJson']],
  [['&doJson', 'requestJson', 'sessionId'], get, ['sessionID']],

  [['&doDelete'], getRequestJson, ['requestJson']],


  [['request', '"headers.cookies"'], get, ['cookies']],
  [['cookies', '"sessionIDJwtCookie"'], getCookieValue, ['jwtCookie']],

  [['jwtCookie'], unwrapJwtCookie, ['jwtObj', 'invalidJwtCookie']],
  [['jwtObj', 'SECRET'], decryptJwt, ['decryptedJwt', 'invalidJwtObj']],
  [['decryptedJwt', 'uid'], get, ['userID']],


  [['&doJson', 'userID'], makeJsonResponseBody, ['responseBody']],
  [['&doJson', 'userID', 'request', 'PREVIOUS_RESULTS'], observeUserSession, []], //

  [['&doDelete', 'request', 'PREVIOUS_RESULTS'], doDelete, ['responseBody']],
  [['&doGetsessions', 'userID', 'PREVIOUS_RESULTS'], doGetsessions, ['responseBody']],

  [['responseBody', 'headers'], makeResponse, ['response']]
];


//KV worker
async function handleRequest(request) {
  try {
    let userdata;

    const url = new URL(request.url);
    const path = url.pathname;                                                            //1
    const [ignore, action] = path.split('/');                                             //2
    if (!action)
      return new Response("no action", {header: {headers}})
    let userID, decryptedPayloadawait, lastSession; //hold userID in global scope to use it for session kv value (userid + sessionID)
    const cookies = request.headers.get('cookie');                                        //3
    const jwtCookie = getCookieValue(cookies, "sessionIDJwtCookie");                      //4

    if (jwtCookie) {
      let jwtObj = JSON.parse(atob(fromBase64url(jwtCookie)));
      //make string to decrypt
      decryptedPayloadawait = await decryptData(jwtObj.header.iv + "." + jwtObj.payload, SECRET);  //5
      userID = "_" + JSON.parse(decryptedPayloadawait).uid;
    }

    if (action === 'json') {                                                             //6
      let session = await request.json();
      session.sessionId = userID + "-" + session.sessionId;
      // lastSession = JSON.stringify(session);
      if (userID)
        await PREVIOUS_RESULTS.put(session.sessionId, JSON.stringify(session));
      return new Response(JSON.stringify({status: !!userID, uId: userID}), {headers: headers});
    }


    if (action === "delete") {
      return await doDelete(request);
    }

    if (action === "getsessions") {
      // if (request.method !== 'GET')
      //     return new Response('not get request'); //describe preflight request
      const values = await PREVIOUS_RESULTS.list();
      const res = [];
      for (key of values.keys) {
        if (key && key.name.startsWith(userID)) {
          let value = await PREVIOUS_RESULTS.get(key.name);
          await res.push(value);
        }
      }
      return new Response(JSON.stringify(res), {headers: headers})
    }

    return new Response("Bad Request", {status: 400, headers: headers});


  } catch (err) {
    return new Response("My error   " + err, {status: 401});
  }
}


addEventListener("fetch", e => {
  e.respondWith(handleRequest(e.request));
});