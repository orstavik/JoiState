/**
 * fireAndSetGlobalVariable is a custom function for:
 * a) fireing an event on the window.
 * b) listening for another event name and adding the detail of that event to the window object.
 * @param fireEventName
 * @param eventData
 * @param listenEventName
 */
const fireAndSetGlobalVariable = function (fireEventName, eventData, listenEventName) {
  outputName = listenEventName + fireAndSetGlobalVariableCounter++;
  const cb = function (ev) {
    window[outputName] = ev.detail;
    window.removeEventListener(listenEventName, cb);
  };
  window.addEventListener(listenEventName, cb);
  window.dispatchEvent(new CustomEvent(fireEventName, {bubbles: true, composed: true, detail: eventData}));
  return outputName;
};
let fireAndSetGlobalVariableCounter = 0;