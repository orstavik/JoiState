/**
 * fireAndSetGlobalVariable is a custom function for:
 * a) fireing an event on the window.
 * b) listening for another event name and adding the detail of that event to the window object.
 * @param fireEventName the name/type of the CustomEvent fired
 * @param fireEventData the event detail of the event fired
 * @param listenEventName the name/type of the event listened for
 * @returns {String} <property name> set on window
 */
const fireAndSetGlobalVariable = function (fireEventName, fireEventData, listenEventName) {
  const outputName = listenEventName + fireAndSetGlobalVariableCounter++;
  const cb = function (ev) {
    window[outputName] = ev.detail;
    window.removeEventListener(listenEventName, cb);
  };
  window.addEventListener(listenEventName, cb);
  window.dispatchEvent(new CustomEvent(fireEventName, {bubbles: true, composed: true, detail: fireEventData}));
  return outputName;
};
let fireAndSetGlobalVariableCounter = 0;