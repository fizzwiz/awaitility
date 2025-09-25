import { Path } from "../util/Path.js";

/**
 * Base error for all Handler-related operations.
 * Can carry a context `path` and an optional `cause`.
 * @extends Error
 */
export class HandlerError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} path - Context path related to the error
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
   * Clones this error with a new cause.
   * Must be implemented in subclasses to preserve all args.
   *
   * @param {*} cause - The underlying cause of the error.
   * @abstract
   */
  clone(cause) {
    throw new Error("abstract method: subclasses must implement clone(cause)");
  } 
      
}  
  

  