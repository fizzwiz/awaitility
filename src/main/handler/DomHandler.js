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
 * Navigate into a nested DOM node using a CSS selector or property path.
 * Overrides the base Handler.with() to support DOM queries.
 *
 * When using a CSS selector (`isQuery = true`):
 * - If the current context is not a DOM node, the error is cloned with a cause.
 * - If querySelector fails, the error is cloned with a cause.
 *
 * @param {string} selector - Path (when isQuery=false) or CSS query selector (when isQuery=true).
 * @param {boolean} [isQuery=false] - If true, treat selector as a CSS query.
 * @param {boolean} [creating=true] - Only used if isQuery=false. If true, the path is created.
 * @param {DomError} [error=new DomError('Node not found for selector', selector, isQuery)]
 *        Custom error to throw if node is not found. Will be cloned with a cause if available.
 * @returns {DomHandler} A new handler targeting the selected node.
 */
with(
    selector,
    isQuery = false,
    creating = true,
    error = new DomError('Node not found for selector', selector, isQuery)
  ) {
    if (isQuery) {
      return this.sthen(ctx => {
        const current = DomHandler.currentCtx(ctx, this.metaCtx);
  
        // Ensure the context is queryable
        if (!current || typeof current.querySelector !== "function") {
          throw error.clone?.(
            new DomError(
              `DomHandler.with: current context is not a DOM node, cannot querySelector`,
              selector,
              true
            )
          ) || error;
        }
  
        // Perform querySelector
        const node = current.querySelector(selector);
        if (!node) {
          const cause = new DomError(
            `DomHandler.with: querySelector failed for selector "${selector}"`,
            selector,
            true
          );
          throw error.clone?.(cause) || error || cause;
        }
  
        // Push into stack
        const stack = ctx[this.metaCtx] || [];
        stack.push(node);
        ctx[Handler.metaCtx] = stack;
  
        return ctx;
      });
    }
  
    // Fallback: property-path navigation using base Handler
    return super.with(selector, creating, error);
  }
  
/**
 * Pre-execution set of a DOM attribute (before current handler executes).
 *
 * @param {string} attr - Attribute name.
 * @param {*} value - Value to assign.
 * @param {DomError} [error=new DomError(`Not a DOM element`)] - Error to throw if context is invalid.
 * @returns {DomHandler}
 */
settingAttr(attr, value, error = new DomError(`Not a DOM element`)) {
    return this.if(ctx => DomHandler.doSetAttr(ctx, attr, value, error));
  }
  
  /**
   * Post-execution set of a DOM attribute (after current handler executes).
   *
   * @param {string} attr - Attribute name.
   * @param {*} value - Value to assign.
   * @param {DomError} [error=new DomError(`Not a DOM element`)] - Error to throw if context is invalid.
   * @returns {DomHandler}
   */
  setAttr(attr, value, error = new DomError(`Not a DOM element`)) {
    return this.sthen(ctx => DomHandler.doSetAttr(ctx, attr, value, error));
  }
  
  /**
   * Static helper to set a DOM attribute.
   *
   * @param {Element|Object} ctx - Current context node (must implement `setAttribute`).
   * @param {string} attr - Attribute name.
   * @param {*} value - Value to assign.
   * @param {DomError} error - Error instance to throw if context is invalid.
   * @returns {Element|Object} The same context, for chaining.
   * @throws {DomError} If the current context is not a DOM element.
   */
  static doSetAttr(ctx, attr, value, error = new DomError(`Not a DOM element`)) {
    const node = Handler.currentCtx(ctx);
    if (!node || typeof node.setAttribute !== "function") {
      const cause = new DomError(`doSetAttr: current context cannot setAttribute`);
      throw error.clone?.(cause) || error || cause;
    }
    node.setAttribute(attr, value);
    return ctx;
  }
  
  
/**
 * Pre-execution check of a DOM attribute (before the business logic runs).
 *
 * @param {string} attr - The attribute name to validate.
 * @param {Function} [validator=v=>!!v] - A predicate function that receives the attribute value
 *   and must return `true` for the check to pass. Defaults to truthy check.
 * @param {DomError} [error=new DomError(`Invalid or missing attribute`)] - Error instance used if
 *   the context is not a DOM element or validation fails.
 * @returns {DomHandler} A new DomHandler in the chain.
 */
checkingAttr(attr, validator = v => !!v, error = new DomError(`Invalid or missing attribute`)) {
    return this.if(ctx => DomHandler.doCheckAttr(ctx, attr, validator, error));
  }
  
  /**
   * Post-execution check of a DOM attribute (after the business logic runs).
   *
   * @param {string} attr - The attribute name to validate.
   * @param {Function} [validator=v=>!!v] - A predicate function that receives the attribute value
   *   and must return `true` for the check to pass. Defaults to truthy check.
   * @param {DomError} [error=new DomError(`Invalid or missing attribute`)] - Error instance used if
   *   the context is not a DOM element or validation fails.
   * @returns {DomHandler} A new DomHandler in the chain.
   */
  checkAttr(attr, validator = v => !!v, error = new DomError(`Invalid or missing attribute`)) {
    return this.sthen(ctx => DomHandler.doCheckAttr(ctx, attr, validator, error));
  }
  
  /**
   * Static helper to check a DOM attribute.
   *
   * @param {Element|Object} ctx - The current context node (must implement `getAttribute`).
   * @param {string} attr - The attribute name to validate.
   * @param {Function} validator - A predicate function that validates the attribute value.
   * @param {DomError} error - Error instance to throw or clone if validation fails.
   * @returns {Element|Object} The same context if validation succeeds.
   * @throws {DomError} If the context is not a DOM element or validation fails.
   */
  static doCheckAttr(ctx, attr, validator, error = new DomError(`Invalid or missing attribute`)) {
    const node = Handler.currentCtx(ctx);
    if (!node || typeof node.getAttribute !== "function") {
      const cause = new DomError(`doCheckAttr: current context cannot getAttribute`);
      throw error.clone?.(cause) || error || cause;
    }
  
    const value = node.getAttribute(attr);
    if (!validator(value)) {
        const cause = new DomError(`doCheckAttr: attribute "${attr}" failed validation`, attr, true);
        throw error.clone?.(cause) || error || cause;
    }
  
    return ctx;
  }
  
}
