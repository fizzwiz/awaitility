import { Res } from './Res.js';

/**
 * Utility class for normalizing and preparing HTTP request data across frameworks.
 *
 * Provides methods for:
 * - Parsing the request body (JSON, URL-encoded, raw)
 * - Parsing query parameters
 * - Parsing cookies
 * - Retrieving authentication tokens
 * - Enforcing allowed HTTP methods
 */
export class Req {

  /**
   * Ensures that the request body is parsed.
   * If the body is missing, attempts to parse it from the raw request.
   *
   * @param {IncomingMessage|Object} req HTTP request object
   * @param {IncomingMessage|Object} res HTTP response object (optional)
   * @returns {Promise<boolean>} True if the body is present or successfully parsed, false otherwise
   */
  static async prepareBody(req, res) {
    if (req.body) return true;
    const got = await Req.getBody(req);
    if (got) req.body = got;
    return !!got;
  }

  /**
   * Ensures the request query parameters are available.
   * Always succeeds; an empty object is acceptable.
   *
   * @param {IncomingMessage|Object} req HTTP request object
   * @returns {boolean} Always true
   */
  static prepareQuery(req) {
    if (!req.query) {
      req.query = Req.getQuery(req);
    }
    return true;
  }

  /**
   * Ensures the request cookies are available.
   * Always succeeds; an empty object is acceptable.
   *
   * @param {IncomingMessage|Object} req HTTP request object
   * @returns {boolean} Always true
   */
  static prepareCookies(req) {
    if (!req.cookies) {
      req.cookies = Req.getCookies(req);
    }
    return true;
  }

  /**
   * Ensures that a token is available in the request.
   *
   * @param {IncomingMessage|Object} req HTTP request object
   * @param {Object} tokenNames Optional token locations: { cookie, header, query }
   * @returns {boolean} True if a token is found, false otherwise
   */
  static prepareToken(req, tokenNames = { cookie: 'token', header: 'Authorization', query: 'token' }) {
    if (!req.token) req.token = this.getToken(req, tokenNames);
    return !!req.token;
  }
  
  /**
   * Ensure that the request has a parsed `URL` object attached.
   *
   * If the request does not already have a `req.URL` property, this method:
   *  1. Calls `getURL(req)` to parse `req.url` into a `URL` object.
   *  2. Normalizes the pathname of the URL.
   *  3. Attaches the resulting `URL` object to `req.URL`.
   *
   * Subsequent calls will reuse the cached `req.URL` object.
   *
   * @param req  The Node.js HTTP request object.
   * @return true if the request now has a `req.URL` property.
   */
  static prepareURL(req) {
    if (!req.URL) req.URL = this.getURL(req);
    return !!req.URL;
  }


/**
 * Parse the raw request URL into a `URL` object and normalize its pathname.
 *
 * Node's `req.url` contains only the path and query string. This method:
 *  1. Prepends a base (from the Host header, or `localhost` if missing)
 *     so that `new URL()` can parse it.
 *  2. Normalizes the resulting pathname using `Path.normalize` to
 *     collapse duplicate slashes, remove `.` / `..` segments, and
 *     standardize trailing slashes.
 *
 * The query string (`?foo=bar`) and other URL components remain intact.
 *
 * @param req  The Node.js HTTP request object.
 * @return A `URL` object representing the request URL, with a normalized pathname.
 */
static getURL(req) {
  const base = `http://${req.headers.host || 'localhost'}`;
  const url = new URL(req.url, base);
  url.pathname = Path.normalize(url.pathname);
  return url;
}



  /**
   * Parses the request body.
   * Supports JSON, URL-encoded forms, and raw text.
   *
   * @param {IncomingMessage|Object} req HTTP request object
   * @returns {Promise<Object|string|undefined>} Parsed body object, raw string, or undefined if body cannot be read
   * @throws {Error} If JSON body is invalid
   */
  static async getBody(req) {
    if (req.body) return req.body;

    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return undefined;

    let raw = '';

    if (req.on) {
      // Node.js readable stream
      for await (const chunk of req) {
        raw += chunk;
      }
    } else if (typeof req === 'object') {
      return req.body || undefined;
    }

    const contentType = (req.headers?.['content-type'] || '').toLowerCase();

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error('Invalid JSON in request body');
      }
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(raw.trim());
      return Object.fromEntries(params.entries());
    }

    // fallback: just return raw string
    return raw;
  }

  /**
   * Parses cookies from the request headers.
   *
   * @param {IncomingMessage|Object} req HTTP request object
   * @returns {Object} Object with cookie names as keys and values as decoded strings
   */
  static getCookies(req) {
    if (req.cookies) return req.cookies;

    const cookieHeader = req?.headers?.cookie;
    if (!cookieHeader) return {};

    return Object.fromEntries(
      cookieHeader
        .split(';')
        .map(c => c.split('=').map(s => s.trim()))
        .filter(([name, value]) => name && value)
        .map(([name, value]) => [name, decodeURIComponent(value)])
    );
  }

  /**
   * Parses query parameters from the request URL.
   *
   * @param {IncomingMessage|Object} req HTTP request object
   * @returns {Object} Object with query parameter names as keys and their string values
   */
  static getQuery(req) {
    if (req.query) return req.query;

    try {
      const url = new URL(req?.url || '', 'http://localhost');
      return Object.fromEntries(url.searchParams.entries());
    } catch {
      return {};
    }
  }

  /**
   * Retrieves a token from the request (cookie, header, or query).
   *
   * @param {IncomingMessage|Object} req HTTP request object
   * @param {Object} tokenNames Locations for token: { cookie, header, query }
   * @returns {string|undefined} Token string if found, undefined otherwise
   */
  static getToken(req, tokenNames = { cookie: 'token', header: 'Authorization', query: 'token' }) {
    const cookies = Req.getCookies(req);
    if (cookies && cookies[tokenNames.cookie]) {
      return cookies[tokenNames.cookie];
    }

    const authHeader = req?.headers?.[tokenNames.header?.toLowerCase()];
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        return parts[1];
      }
      return authHeader;
    }

    const query = Req.getQuery(req);
    if (query && query[tokenNames.query]) {
      return query[tokenNames.query];
    }

    return undefined;
  }

  /**
   * Enforces allowed HTTP methods for a request.
   * If the request method is not allowed, sends a 405 response and sets the Allow header.
   *
   * @param {string|string[]} methodOrMethods Allowed HTTP method(s)
   * @param {IncomingMessage|Object} req HTTP request object
   * @param {IncomingMessage|Object} res HTTP response object
   * @returns {boolean} True if method is allowed, false if request was blocked
   */
  static enforceMethod(methodOrMethods, req, res) {
    const allowed = Array.isArray(methodOrMethods)
      ? methodOrMethods.map(m => m.toUpperCase())
      : methodOrMethods
          .split(/(?:,|\s)+/)
          .map(m => m.trim().toUpperCase())
          .filter(Boolean);

    const reqMethod = req.method.toUpperCase();
    if (!allowed.includes(reqMethod)) {
      res.setHeader("Allow", allowed.join(", "));
      Res.json(res, 405, { success: false, error: "Method Not Allowed" });
      return false;
    }

    return true;
  }
}
