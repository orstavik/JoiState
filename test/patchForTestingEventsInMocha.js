/**
 * this function
 * 1) adds a one time listener for the state-changed event,
 * 2) it takes the state (detail) coming from this event and sets it as a global variable on window
 * 3) it the fires an event that is supposed to trigger the state with the eventData
 * @param eventName
 * @param eventData
 */
const fireAndSetGlobalVariable = function (fireEventName, eventData, outputName, listenEventName) {
  const cb = function (ev) {
    window[outputName] = ev.detail;
    window.removeEventListener(listenEventName, cb);
  };
  window.addEventListener(listenEventName, cb);
  window.dispatchEvent(new CustomEvent(fireEventName, {bubbles: true, composed: true, detail: eventData}));
};