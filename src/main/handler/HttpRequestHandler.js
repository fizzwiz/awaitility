import { Handler } from "../core/Handler.js";
import { Req } from "../util/Req.js";
import { Res } from "../util/Res.js";
import { Notification } from "../core/Notification.js";

/**
 * HttpRequestHandler
 * ------------------
 * Chainable handler for HTTP requests.
 * 
 * Dedicated methods (parsing and validation) assume they operate on the **root context**,
 * which must contain the following properties:
 *   - `req`: the HTTP request object
 *   - `res`: the HTTP response object
 * 
 * Provides:
 * - Async `prepare` methods for populating `req.body`, `req.query`, `req.cookies`, and `req.token`.
 * - Synchronous `check` methods for validating request method, headers, query parameters, cookies, and token.
 * 
 * Error handling is automatic via a default or custom `onError` callback.
 */

export class HttpRequestHandler extends Handler {

  constructor(ctx) {
    super(
      ctx,
      { message: "handler-fail" },
      HttpRequestHandler.defaultOnError
    );
  }

  /**
   * Default onError callback: sends a Notification as JSON via the HTTP response.
   */
  static defaultOnError(err, handler) {
    const res = handler.get("res");
    if (!res || res.headersSent) return;

    const notification = Notification.fromError(err);
    delete notification.emitter;
    const code = err.code || 400;

    Res.json(res, code, notification, handler);
  }

// ----------------- Parsing methods -----------------

    /**
     * Parses and attaches the request body (async).
     * After this call, `req.body` will be set.
     * @returns {Promise<HttpRequestHandler>}
     */
    async prepareBody() {
        return this.asyncCheck(
        async ({ req }) => {
            return await Req.prepareBody(req);
        },
        { message: 'body-prepare', code: 422 },
        this.defaultOnError
        );
    }
  
  /**
   * Parses and attaches query parameters (sync).
   * After this call, `req.query` will be set.
   * @returns {HttpRequestHandler}
   */
  prepareQuery() {
    return this.check(
      ({ req }) => {
        Req.prepareQuery(req);
        return true;
      },
      { message: 'query-prepare', code: 422 },
      this.defaultOnError
    );
  }
  
  /**
   * Parses and attaches cookies (sync).
   * After this call, `req.cookies` will be set.
   * @returns {HttpRequestHandler}
   */
  prepareCookies() {
    return this.check(
      ({ req }) => {
        Req.prepareCookies(req);
        return true;
      },
      { message: 'cookies-prepare', code: 422 },
      this.defaultOnError
    );
  }
  
  /**
   * Parses and attaches a token to the request.
   * Looks in cookie, Authorization header, and query string (in that order).
   * @param {object} [tokenNames] - Optional names for cookie/header/query
   * @param {string} [tokenNames.cookie='token']
   * @param {string} [tokenNames.header='Authorization']
   * @param {string} [tokenNames.query='token']
   * @returns {HttpRequestHandler}
   */
  prepareToken(tokenNames = { cookie: 'token', header: 'Authorization', query: 'token' }) {
    return this.check(
      ({ req }) => Req.prepareToken(req, tokenNames),
      { message: 'token-parse', code: 401 },
      this.defaultOnError
    );
  }

  // ----------------- Validation methods -----------------

  checkMethod(...methods) {
    return this.check(
      ({ req }) => methods.map(m => m.toUpperCase()).includes(req.method.toUpperCase()),
      { message: `method-check`, code: 405 },
      this.defaultOnError
    );
  }

  checkToken(validator = Boolean, tokenNames = { cookie: 'token', header: 'Authorization', query: 'token' }) {
    return this.check(
      ({ req }) => {
        req.token = req.token || Req.getToken(req, tokenNames);
        return validator(req.token);
      },
      { message: 'token-check', code: 401 },
      this.defaultOnError
    );
  }

  checkQueryParam(param, validator = Boolean) {
    return this.check(
      ({ req }) => validator(req.query?.[param]),
      { message: `query-param:${param}-check`, code: 422 },
      this.defaultOnError
    );
  }

  checkCookie(name, validator = Boolean) {
    return this.check(
      ({ req }) => validator(req.cookies?.[name]),
      { message: `cookie:${name}-check`, code: 422 },
      this.defaultOnError
    );
  }

  checkHeader(name, validator = Boolean) {
    return this.check(
      ({ req }) => validator(req.headers?.[name.toLowerCase()]),
      { message: `header:${name}-check`, code: 422 },
      this.defaultOnError
    );
  }

  checkContentType(expected) {
    return this.checkHeader(
      'content-type',
      val => val != null && (expected instanceof RegExp ? expected.test(val) : val === expected)
    );
  }

  checkAccept(expected) {
    return this.checkHeader(
      'accept',
      val => val != null && (expected instanceof RegExp ? expected.test(val) : val === expected)
    );
  }

}
