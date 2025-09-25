import { Handler} from "../core/Handler.js";
import { DomError } from "../error/DomError.js";

/**
 * DomHandler
 * ----------
 * Extends the base Handler class with DOM-specific helpers:
 * - Selecting a node by CSS query selector
 * - Checking or setting attributes (for attributes not directly accessible via property paths)
 * 
 * Text content and innerHTML can be accessed/modified using property paths
 *   (e.g., "el.textContent", "el.innerHTML").
 *
 * Works in a chainable, context-aware way like any Handler.
 *
 * Example usage:
 * ```js
 * const handler = DomHandler.as()
 *   .with('#myDiv', true)           // select node by CSS query
 *   .set('textContent', 'Hi')       // sets the textContent
 *   .checkAttr('foo', v => v === 'bar'); // checks an attribute
 * ```
 *
 * @extends Handler
 */
export class DomHandler extends Handler {

  /**
   * Creates a DomHandler instance.
   * 
   * @param {Function} [business] - Optional function representing the business logic
   * @returns {DomHandler}
   */
  static as(business = ctx => ctx) {
    const got = Handler.as(business);
    Object.setPrototypeOf(got, DomHandler.prototype);
    return got;
  }

  /**
   * Navigate into a nested DOM node using a CSS selector or path.
   * Overrides the base Handler.with() to support DOM queries.
   *
   * @param {string} selector - Path (isQuery=false) or CSS query selector (isQuery=true)
   * @param {boolean} [isQuery=false] - If true, treat selector as a CSS query
   * @param {Error} [error] - Custom error to throw if the node is not found
   * @returns {DomHandler} A new handler targeting the selected node
   */
  with(selector, isQuery = false, error = new DomError('Node not found for selector', selector, isQuery)) {
    if (isQuery) {
      const got = this.sthen(ctx => {
        const current = DomHandler.currentCtx(ctx, this.metaCtx);

        if (!(current instanceof Element || current instanceof Document)) {
          throw HandlerError.build(
            selector,
            error,
            ctx,
            new DomError(`DomHandler.with: current context is not a DOM node, cannot querySelector`, selector, true)
          );
        }

        const node = current.querySelector(selector);
        if (!node) {
          throw HandlerError.build(
            selector,
            error,
            ctx,
            new DomError(`DomHandler.with: querySelector failed`, selector, true)
          );
        }

        const stack = ctx[this.metaCtx] || [];
        stack.push(node);
        ctx[this.metaCtx] = stack;

        return ctx;
      });

      got.metaCtx = this.metaCtx;
      return got;
    }

    // Fallback to base Handler.with() for path-based navigation
    return super.with(selector, true);
  }

  /**
   * Pre-execution set of a DOM attribute (before current handler executes).
   *
   * @param {string} attr - Attribute name
   * @param {*} value - Value to set
   * @param {Error} [error] - Optional custom error
   * @returns {DomHandler}
   */
  settingAttr(attr, value, error) {
    return this.setting(
      `attributes.${attr}.value`,
      value,
      true,
      error || new DomError(`Attribute not set: ${attr}`, attr, true)
    );
  }

  /**
   * Pre-execution check of a DOM attribute.
   *
   * @param {string} attr - Attribute name
   * @param {Function} [validator=v=>!!v] - Validator function
   * @param {Error} [error] - Optional custom error
   * @returns {DomHandler}
   */
  checkingAttr(attr, validator = v => !!v, error) {
    return this.checking(
      `attributes.${attr}.value`,
      validator,
      error || new DomError(`Invalid or missing attribute: ${attr}`, attr, true)
    );
  }

  /**
   * Post-execution set of a DOM attribute (after current handler executes).
   *
   * @param {string} attr - Attribute name
   * @param {*} value - Value to set
   * @param {Error} [error] - Optional custom error
   * @returns {DomHandler}
   */
  setAttr(attr, value, error) {
    return this.set(
      `attributes.${attr}.value`,
      value,
      true,
      error || new DomError(`Attribute not set: ${attr}`, attr, true)
    );
  }

  /**
   * Post-execution check of a DOM attribute.
   *
   * @param {string} attr - Attribute name
   * @param {Function} [validator=v=>!!v] - Validator function
   * @param {Error} [error] - Optional custom error
   * @returns {DomHandler}
   */
  checkAttr(attr, validator = v => !!v, error) {
    return this.check(
      `attributes.${attr}.value`,
      validator,
      error || new DomError(`Invalid or missing attribute: ${attr}`, attr, true)
    );
  }

}
