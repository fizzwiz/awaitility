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
}
