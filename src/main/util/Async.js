/** utility methods */
export class Async {

/**
 * Attaches a listener to a target emitter (DOM EventTarget, Node.js EventEmitter, etc.)
 *
 * Features:
 *  - Works with `addEventListener` / `removeEventListener`, `on` / `off`, `addListener` / `removeListener`
 *  - Supports DOM `once` option and Node.js `.once()` if available
 *  - Optionally stores the listener in a registry under a given `name`
 *  - Idempotent: if a listener with the same `name` already exists in the registry, it is detached first
 */
static on(target, event, fn, opts, name, registry) {
  // Resolve registry object
  if (!registry) registry = target;
  if (typeof registry === "string") {
    registry = target[registry] || (target[registry] = {});
  }

  // Detach old listener with the same name if it exists
  if (name && registry[name]) {
    this.off(target, event, name, opts, registry);
  }

  // Attach listener according to emitter type
  if (opts?.once && typeof target.once === "function") {
    target.once(event, fn);
  } else if (typeof target.addEventListener === "function") {
    target.addEventListener(event, fn, opts);
  } else if (typeof target.addListener === "function") {
    target.addListener(event, fn);
  } else if (typeof target.on === "function") {
    target.on(event, fn);
  } else {
    throw new Error('on-failed', { event, fn, opts, name, registry }, target);
  }

  // Store in registry for later detachment
  if (name) registry[name] = fn;
}

/**
 * Detaches a listener from a target emitter.
 *
 * Features:
 *  - Works with the same emitter types as attach
 *  - Can detach by listener function or by `name` stored in the registry
 *  - Safe: does nothing if the listener is not found
 */
static off(target, event, nameOrFn, opts, registry) {
  let fn = nameOrFn;

  // Resolve registry if name provided
  if (typeof nameOrFn === "string") {
    if (typeof registry === "string") registry = target[registry];
    if (!registry) return; // nothing to remove
    fn = registry[nameOrFn];
    delete registry[nameOrFn];
  }

  if (!fn) return; // nothing to remove

  // Detach listener according to emitter type
  if (typeof target.removeEventListener === "function") {
    target.removeEventListener(event, fn, opts);
  } else if (typeof target.removeListener === "function") {
    target.removeListener(event, fn);
  } else if (typeof target.off === "function") {
    target.off(event, fn);
  } else {
    throw new Notification('off-failed', { event, nameOrFn, opts, registry }, target);
  }
}

/**
 * Dispatches or emits an event from any target (DOM, Node.js EventEmitter, or custom emitter).
 *
 * Features:
 *  - Works with `dispatchEvent` (DOM) and `emit` (Node.js EventEmitter)
 *  - Accepts strings, Notifications, CustomEvents, or any object
 *  - Automatically converts non-string events to CustomEvent for DOM targets
 *  - Returns the result of `dispatchEvent` for DOM targets, or the return value of `emit` for Node.js
 *
 * @param {EventTarget|EventEmitter} target - The object that will receive the event
 * @param {string|Object} event - Either a string, Notification, CustomEvent, or any object
 * @param {...any} args - Optional extra arguments for Node.js EventEmitter (ignored for DOM)
 * @returns {boolean|any} `true`/`false` for DOM `dispatchEvent`, or the result of `emit` for Node.js
 * @throws {Error} Throws if the target cannot emit events
 *
 * @example
 * // Node.js EventEmitter
 * Async.emit(emitter, "ready", { foo: 42 });
 *
 * // DOM element with a CustomEvent
 * const customEvent = new CustomEvent("update", { detail: { foo: 42 } });
 * Async.emit(domNode, customEvent);
 *
 * // DOM element with a Notification
 * const noti = new Notification("info", { message: "Hello" });
 * Async.emit(domNode, noti);
 */
static emit(target, event, ...args) {
  // Normalize non-string events
  if (typeof event !== 'string') {
    args = [event];
    event = event?.type || 'object';
  }

  if (typeof target.emit === "function") {
    // Node.js EventEmitter
    return target.emit(event, ...args);
  } else if (typeof target.dispatchEvent === "function") {
    // DOM EventTarget: always convert the first argument to CustomEvent
    return target.dispatchEvent(Async.toCustomEvent(args[0]));
  } else {
    throw new Error(`emit-failed: Target cannot emit events`);
  }
}

/**
 * Convert any object into a DOM CustomEvent
 * @param {string|CustomEvent|object} obj - Object to convert
 * @param {string} [defaultType="generic"] - Default event type if obj has none
 * @returns {CustomEvent}
 */
static toCustomEvent(obj, defaultType = "object") {
  if (obj instanceof CustomEvent) return obj;

  // if obj is a string, treat it as event type with empty detail
  if (typeof obj === "string") {
    return new CustomEvent(obj, { detail: {} });
  }

  // if obj has a type property, use it, else defaultType
  const type = obj?.type || defaultType;
  return new CustomEvent(type, { obj });
}

}