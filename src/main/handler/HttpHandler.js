import { Handler } from "../core/Handler.js";
import { Req } from "../util/Req.js";
import { HttpError } from "../error/HttpError.js";

/**
 * HttpHandler
 * -----------
 * Extends the base Handler class with HTTP-specific helpers for request validation
 * and preparation.
 *
 * Features:
 * - Pre/post-execution checks for req.body, req.query, req.cookies, req.token.
 * - Throws HttpError on validation failures.
 * - Designed to integrate with error middleware to send JSON responses.
 */
export class HttpHandler extends Handler {
  
  static as(business = ctx => ctx) {
    const got = Handler.as(business);
    Object.setPrototypeOf(got, HttpHandler.prototype);
    return got;
  }

  // --- Request preparation methods ---

  /** Pre-execution body preparation */
  preparingBody(error = new HttpError(422, "invalid or malformed JSON body")) {
    return this.checking("req", async req => await Req.prepareBody(req), error);
  }

  /** Post-execution body preparation */
  prepareBody(error = new HttpError(422, "invalid or malformed JSON body")) {
    return this.check("req", async req => await Req.prepareBody(req), error);
  }

  /** Pre-execution req.URL preparation */
  preparingURL(error = new HttpError(400, "invalid or malformed request URL")) {
    return this.checking("req", Req.prepareURL, error);
  }

  /** Post-execution req.URL preparation */
  prepareURL(error = new HttpError(400, "invalid or malformed request URL")) {
    return this.check("req", Req.prepareURL, error);
  }

  /** Pre-execution query preparation (always succeeds) */
  preparingQuery() {
    return this.checking("req", req => Req.prepareQuery(req));
  }

  /** Post-execution query preparation (always succeeds) */
  prepareQuery() {
    return this.check("req", req => Req.prepareQuery(req));
  }

  /** Pre-execution cookies preparation (always succeeds) */
  preparingCookies() {
    return this.checking("req", req => Req.prepareCookies(req));
  }

  /** Post-execution cookies preparation (always succeeds) */
  prepareCookies() {
    return this.check("req", req => Req.prepareCookies(req));
  }

  /** Pre-execution token preparation */
  preparingToken(
    error = new HttpError(401, "missing authentication token")
  ) {
    return this.checking("req", req => Req.prepareToken(req), error);
  }

  /** Post-execution token preparation */
  prepareToken(
    error = new HttpError(401, "missing authentication token")
  ) {
    return this.check("req", req => Req.prepareToken(req), error);
  }

    /**
   * Pre-execution check: ensures the request HTTP method matches the expected method.
   *
   * If the check fails, the provided error (default 405 Method Not Allowed) will be triggered.
   *
   * @param {string} expected  Expected HTTP method (e.g., "GET", "POST").
   * @param {HttpError} [error=new HttpError(405, "Invalid HTTP method")]  Error to throw if method doesn't match.
   * @return {HttpHandler}  Returns this for chaining.
   */
  checkingMethod(expected, error = new HttpError(405, "Invalid HTTP method")) {
    return this.checking(
      "req.method",
      m => typeof m === "string" && m === expected,
      error
    );
  }

  /**
   * Post-execution check: ensures the request HTTP method matches the expected method.
   *
   * If the check fails, the provided error (default 405 Method Not Allowed) will be triggered.
   *
   * @param {string} expected  Expected HTTP method (e.g., "GET", "POST").
   * @param {HttpError} [error=new HttpError(405, "Invalid HTTP method")]  Error to throw if method doesn't match.
   * @return {HttpHandler}  Returns this for chaining.
   */
  checkMethod(expected, error = new HttpError(405, "Invalid HTTP method")) {
    return this.check(
      "req.method",
      m => typeof m === "string" && m === expected,
      error
    );
  }

  /**
 * Pre-execution check: ensures the request `Accept` header includes the expected MIME type.
 *
 * If the check fails, the provided error (default 406 Not Acceptable) will be triggered.
 *
 * @param {string} mimeType  Expected MIME type (e.g., "application/json").
 * @param {HttpError} [error=new HttpError(406, "Not Acceptable")]  Error to throw if check fails.
 * @return {HttpHandler}  Returns this for chaining.
 */
checkingAccept(mimeType, error = new HttpError(406, "Not Acceptable")) {
  return this.checking(
    "req.headers.accept",
    accept => typeof accept === "string" && accept.includes(mimeType),
    error
  );
}

/**
 * Post-execution check: ensures the request `Accept` header includes the expected MIME type.
 *
 * If the check fails, the provided error (default 406 Not Acceptable) will be triggered.
 *
 * @param {string} mimeType  Expected MIME type (e.g., "application/json").
 * @param {HttpError} [error=new HttpError(406, "Not Acceptable")]  Error to throw if check fails.
 * @return {HttpHandler}  Returns this for chaining.
 */
checkAccept(mimeType, error = new HttpError(406, "Not Acceptable")) {
  return this.check(
    "req.headers.accept",
    accept => typeof accept === "string" && accept.includes(mimeType),
    error
  );
}

/**
 * Pre-execution check: ensures the request `Content-Type` header includes the expected MIME type.
 *
 * If the check fails, the provided error (default 400 Bad Request) will be triggered.
 *
 * @param {string} mimeType  Expected MIME type (e.g., "application/json").
 * @param {HttpError} [error=new HttpError(400, "Invalid Content-Type")]  Error to throw if check fails.
 * @return {HttpHandler}  Returns this for chaining.
 */
checkingContentType(mimeType, error = new HttpError(400, "Invalid Content-Type")) {
  return this.checking(
    "req.headers.content-type",
    type => typeof type === "string" && type.includes(mimeType),
    error
  );
}

/**
 * Post-execution check: ensures the request `Content-Type` header includes the expected MIME type.
 *
 * If the check fails, the provided error (default 400 Bad Request) will be triggered.
 *
 * @param {string} mimeType  Expected MIME type (e.g., "application/json").
 * @param {HttpError} [error=new HttpError(400, "Invalid Content-Type")]  Error to throw if check fails.
 * @return {HttpHandler}  Returns this for chaining.
 */
checkContentType(mimeType, error = new HttpError(400, "Invalid Content-Type")) {
  return this.check(
    "req.headers.content-type",
    type => typeof type === "string" && type.includes(mimeType),
    error
  );
}


}
