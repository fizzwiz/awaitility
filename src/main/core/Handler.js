import { EventEmitter } from "events";
import { Path as Paths } from "../util/Path.js";
import { Path } from "@fizzwiz/fluent";

/**
 * Handler
 * -------
 * Base class for chainable, context-aware operations with automatic error handling.
 * Supports:
 * - Synchronous and asynchronous checks (`check`, `asyncCheck`)
 * - Nested context navigation (`with`, `without`)
 * - Getting and setting properties relative to current context
 * - Error enrichment and emission
 */
export class Handler extends EventEmitter {

  /** Stack of context objects (root + nested via `with`) */
  path;

  /** Whether the handler is still valid */
  ok;

  /** Default error handler */
  defaultOnError;

  /** Default error object for enrichment */
  defaultError;

  /**
   * Creates a new Handler.
   * @param {object} ctx Root context object.
   * @param {object} [error] Default error for enrichment.
   * @param {function} [onError] Default error callback.
   */
  constructor(ctx, error, onError) {
    super();
    this.path = Path.of(ctx);
    this.ok = true;
    this.defaultError = error;
    this.defaultOnError = onError;
  }

  /** Current context (top of the path stack) */
  get ctx() {
    return this.path.last;
  }

  /**
   * Navigate into a nested context by path.
   * Fails immediately if the path is missing or unchanged.
   * @param {string|string[]} stringOrArray Dot-path string or array of keys.
   * @param {object} [error] Optional error object.
   * @param {function} [onError] Optional error callback.
   * @param {boolean} [creating=false] If true, create intermediate objects.
   * @returns {Handler} this
   */
  with(stringOrArray, error = undefined, onError = this.defaultOnError, creating = false) {
    const next = Paths.get(this.ctx, Paths.keys(stringOrArray), creating);

    if (next === this.ctx || next === undefined) {
      return this.fail(
        error ?? { message: `Path not found: ${stringOrArray}` },
        undefined,
        onError
      );
    }

    this.path = this.path.add(next);
    return this;
  }

  /**
   * Exit the current nested context.
   * @param {number} [nsteps=1] Number of levels to go up.
   * @returns {Handler} this
   */
  without(nsteps = 1) {
    for (let i = 0; i < nsteps; i++) {
      if (this.path.length > 1) this.path = this.path.parent;
    }
    return this;
  }

  /**
   * Synchronous predicate check on current context.
   * @param {function(object, Handler): boolean} [predicate=Boolean] Predicate function.
   * @param {object} [error] Optional error object.
   * @param {function} [onError] Optional error callback.
   * @returns {Handler} this
   */
  check(predicate = Boolean, error = undefined, onError = this.defaultOnError) {
    if (!this.ok) return this;
    try {
      const ok = predicate(this.ctx, this);
      if (!ok) throw error;
      return this;
    } catch (err) {
      return this.fail(error, err, onError);
    }
  }

  /**
   * Asynchronous predicate check on current context.
   * @param {function(object, Handler): Promise<boolean>} [predicate=Boolean] Async predicate.
   * @param {object} [error] Optional error object.
   * @param {function} [onError] Optional error callback.
   * @returns {Promise<Handler>} this
   */
  async asyncCheck(predicate = Boolean, error = undefined, onError = this.defaultOnError) {
    if (!this.ok) return this;
    try {
      const ok = await predicate(this.ctx, this);
      if (!ok) throw error;
      return this;
    } catch (err) {
      return this.fail(error, err, onError);
    }
  }

  /**
   * Get a property from the current context.
   * @param {string|string[]} [path] Dot-path string or array of keys.
   * @param {boolean} [creating=false] If true, create intermediate objects.
   * @returns {any} Value at the path or current context if no path.
   */
  get(path, creating = false) {
    return path ? Paths.get(this.ctx, Paths.keys(path), creating) : this.ctx;
  }

  /**
   * Sets a property in the current context.
   * @param {string|string[]} path Path to set.
   * @param {any|function} value Value or function returning value.
   * @param {object} [error] Optional error object.
   * @param {function} [onError] Optional error callback.
   * @param {boolean} [creating=false] Whether to create intermediate objects.
   * @returns {Handler} this
   */
  set(path, value, error = undefined, onError = this.defaultOnError, creating = false) {
    if (!this.ok) return this;
    try {
      const keys = Paths.keys(path);
      const trg = creating && keys.length > 1
        ? Paths.get(this.ctx, keys.slice(0, -1), true)
        : this.ctx;
      const val = typeof value === 'function' ? value(trg, this) : value;

      if (keys.length > 1 && creating) {
        trg[keys[keys.length - 1]] = val;
      } else {
        Paths.set(this.ctx, keys, val);
      }
    } catch (err) {
      return this.fail(error, err, onError);
    }
    return this;
  }

  /**
   * Asynchronously sets a property in the current context.
   * @param {string|string[]} path Path to set.
   * @param {any|Promise|function} value Value, promise, or async function.
   * @param {object} [error] Optional error object.
   * @param {function} [onError] Optional error callback.
   * @param {boolean} [creating=false] Whether to create intermediate objects.
   * @returns {Promise<Handler>} this
   */
  async asyncSet(path, value, error = undefined, onError = this.defaultOnError, creating = false) {
    if (!this.ok) return this;
    try {
      const keys = Paths.keys(path);
      const trg = creating && keys.length > 1
        ? Paths.get(this.ctx, keys.slice(0, -1), true)
        : this.ctx;
      const val = typeof value === 'function' ? await value(trg, this) : await value;

      if (keys.length > 1 && creating) {
        trg[keys[keys.length - 1]] = val;
      } else {
        Paths.set(this.ctx, keys, val);
      }
    } catch (err) {
      return this.fail(error, err, onError);
    }
    return this;
  }

  /**
   * Execute a synchronous function on the current context.
   * @param {function(object, Handler)} fn Function to execute.
   * @param {object} [error] Optional error object.
   * @param {function} [onError] Optional error callback.
   * @returns {Handler} this
   */
  async exec(fn, error = undefined, onError = this.defaultOnError) {
    if (!this.ok) return this;
    try {
      fn(this.ctx, this);
    } catch (err) {
      return this.fail(error, err, onError);
    }
    return this;
  }

  /**
   * Execute an asynchronous function on the current context.
   * @param {function(object, Handler): Promise} fn Async function to execute.
   * @param {object} [error] Optional error object.
   * @param {function} [onError] Optional error callback.
   * @returns {Promise<Handler>} this
   */
  async asyncExec(fn, error = undefined, onError = this.defaultOnError) {
    if (!this.ok) return this;
    try {
      await fn(this.ctx, this);
    } catch (err) {
      return this.fail(error, err, onError);
    }
    return this;
  }

  /**
   * Enrich an error object with default context info.
   * @param {object} err Error object.
   * @param {Error} [causeErr] Optional underlying cause.
   * @returns {object} Enriched error object.
   */
  enrich(err, causeErr) {
    const enriched = Object.assign({}, this.defaultError, err, { emitter: this });
    enriched.message = `${this.defaultError?.message || 'handler-fail'}:${err?.message || ''}`.replace(/:$/, '');
    enriched.cause = causeErr;
    return enriched;
  }

  /**
   * Fail the handler and invoke error callbacks.
   * @param {object} err Error object.
   * @param {Error} [cause] Optional underlying cause.
   * @param {function} [onError] Optional error callback.
   * @returns {Handler} this
   */
  fail(err, cause, onError = this.defaultOnError) {
    this.ok = false;
    const enriched = this.enrich(err, cause);
    if (onError) onError(enriched, this);
    this.emit(this.defaultError?.message || 'handler-fail', enriched);
    this.emit(enriched.message, enriched);
    return this;
  }
}
