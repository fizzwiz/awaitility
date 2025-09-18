import { Handler } from "../core/Handler.js";

/**
 * Domler
 * ----------
 * Chainable handler for DOM navigation, validation, and mutation.
 * The `ctx` is always a Node (Document, Element, etc.).
 */
export class Domler extends Handler {
  constructor(ctx, error, onError) {
    super(ctx, error ?? { message: "dom-handler-fail" }, onError);
  }

    /**
     * Navigate into a child element by a CSS selector.
     * 
     * Works exactly like {@link with}, except the navigation target
     * is resolved using `querySelector` instead of a property path.
     * 
     * Use {@link without} to step back out of the selected element,
     * just as with property-based navigation.
     *
     * @param {string} selector CSS selector.
     * @returns {Domler} this
     *
     * @example
     * // CSS selector navigation:
     * handler.withQuery("#container > span.item");
     *
     * // Step back to the parent context:
     * handler.without();
     */
    withQuery(selector, error = undefined, onError = this.defaultOnError) {
        if (!this.ok) return this;
    
        const next = this.ctx.querySelector(selector);
        if (!next) return this.fail(error ?? { message: `Element not found: ${selector}` }, undefined, onError);

        this.path = this.path.add(next); // Path is immutable
    
        return this;
    }

    setText(value, error, onError) {
        return this.exec(el => {
          el.textContent = typeof value === "function" ? value(el, this) : value;
        }, error, onError);
      }
      
      setHTML(html, error, onError) {
        return this.asyncExec(el => {
          el.innerHTML = typeof html === "function" ? html(el, this) : html;
        }, error, onError);
      }
      
      setAttr(attr, value, error, onError) {
        return this.asyncExec(el => {
          const val = typeof value === "function" ? value(el, this) : value;
          el.setAttribute(attr, val);
        }, error, onError);
      }
      
 
    async asyncSetText(value, error, onError) {
        return this.asyncExec(async (el) => {
          el.textContent = typeof value === "function" ? await value(el, this) : await value;
        }, error, onError);
      }
      
      async asyncSetHTML(html, error, onError) {
        return this.asyncExec(async (el) => {
          el.innerHTML = typeof html === "function" ? await html(el, this) : await html;
        }, error, onError);
      }
      
      async asyncSetAttr(attr, value, error, onError) {
        return this.asyncExec(async (el) => {
          const val = typeof value === "function" ? await value(el, this) : await value;
          el.setAttribute(attr, val);
        }, error, onError);
      }
      
 
}
