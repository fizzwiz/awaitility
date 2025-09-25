import { Path } from "../util/Path.js";

/**
 * Base error for all Handler-related operations.
 * Can carry a context `path` and an optional `cause`.
 * @extends Error
 */
export class HandlerError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string|string[]} path - Context path related to the error
     * @param {Error} [cause] - Optional underlying error
     */
    constructor(message, path, cause) {
      super(message);
      /** Name of the error class */
      this.name = this.constructor.name;
      /** Path in the context where the error occurred */
      this.path = path;
      /** Optional underlying error */
      if (cause) this.cause = cause;
    }
      
        /**
         * Normalize a provided error or factory into a HandlerError instance.
         * Attaches the low-level cause if present.
         *
         * @param {string|string[]} path Property path or context
         * @param {HandlerError|Function} error Error instance or factory `(path, ctx, cause) => HandlerError`
         * @param {Error} [cause] Low-level error that triggered this one
         * @returns {HandlerError}
         */
        static build(path, error, ctx, cause) {
          let err = typeof error === "function" ? error(path, ctx, cause) : error;
          if (cause && !err.cause) err.cause = cause;
          return err;
        }
    }  
  

  