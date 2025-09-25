  import { HandlerError } from "../core/HandlerError.js";

  /**
   * Structured HTTP error for use in HttpHandler.
   * Includes an HTTP status code.
   * @extends HandlerError
   */
  export class HttpError extends HandlerError {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {string|string[]} path - Context path related to the error
     * @param {Error} [cause] - Optional underlying error
     */
    constructor(statusCode, message, path, cause) {
      super(message, path, cause);
      /** HTTP status code associated with the error */
      this.statusCode = statusCode;
    }

          /**
   * Clones this error with a new cause.
   *
   * @param {*} cause - The underlying cause of the error.
   */
  clone(cause) {
    return new HttpError(this.statusCode, this.message, this.path, cause);
  } 
  }