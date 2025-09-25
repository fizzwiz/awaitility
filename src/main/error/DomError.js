import { HandlerError } from "../core/HandlerError.js";
  
  /**
   * Structured DOM error for use in DomHandler.
   * Includes a flag for distinguishing property paths from CSS queries.
   * @extends HandlerError
   */
  export class DomError extends HandlerError {
    /**
     * @param {string} message - Error message
     * @param {string|string[]} path - Context path related to the error
     * @param {bool} [isQuery] - The path is a CSS query
     * @param {Error} [cause] - Optional underlying error
     */
    constructor(message, path, isQuery = false, cause) {
      super(message, path, cause);
      this.isQuery = isQuery;
    }

      /**
   * Clones this error with a new cause.
   *
   * @param {*} cause - The underlying cause of the error.
   */
  clone(cause) {
    return new DomError(this.message, this.path, this.isQuery, cause);
  } 
  }