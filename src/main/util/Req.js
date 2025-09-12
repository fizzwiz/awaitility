import { parse as parseQuery } from 'querystring';
import { Res } from './Res.js';
/**
 * Utility class for normalizing HTTP request data across frameworks.
 */
export class Req {

  static async prepareBody(req, res) {
    if (req.body) return true;
  
    const method = (req.method || '').toUpperCase();
  
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        req.body = await Req.getBody(req);
      } catch (err) {
        req.body = {};
        req._prepareError = err;
  
        if (res && !res.headersSent) {
          Res.json(res, 400, { error: 'Invalid JSON in request body' });
        }
        return false;
      }
    }
  
    return true; // explicitly success
  }
  

static prepareQuery(req) {
  // Query
  if (!req.query) {
    req.query = Req.getQuery(req);
  }

  return true;
}

static prepareCookies(req) {
  if (!req.cookies) {
    req.cookies = Req.getCookies(req);
  }
  return true;

}

  /**
   * Parse the request body.
   * Returns JSON object if `Content-Type` is JSON, raw string otherwise.
   * @param {IncomingMessage|Object} req
   */
  static async getBody(req) {
    // If body already exists (e.g., Express/Fastify), return it
    if (req.body) return req.body;

    // Only parse for methods that can have a body
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return undefined;

    let raw = '';

    if (req.on) {
      // Node.js readable stream
      for await (const chunk of req) {
        raw += chunk;
      }
    } else if (typeof req === 'object') {
      // Framework-provided body might already exist
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

    // Fallback: URL-encoded form
    return parseQuery(raw);
  }

/**
 * Parse cookies from the request headers.
 * @param {IncomingMessage|Object} req
 * @returns {Object} Parsed cookies
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
 * Parse query parameters from request URL.
 * @param {IncomingMessage|Object} req
 * @returns {Object} Parsed query params
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
 * Retrieve a token from the request.
 * Checks cookie, Authorization header, and query string (in this order).
 *
 * @param {http.IncomingMessage} req
 * @param {Object} tokenNames - Optional names for each source
 * @param {string} tokenNames.cookie - Name of the cookie
 * @param {string} tokenNames.header - Name of the header
 * @param {string} tokenNames.query - Name of the query param
 * @returns {string|undefined} The token if found, otherwise undefined
 */
static getToken(req, tokenNames = { cookie: 'token', header: 'Authorization', query: 'token' }) {

  // 1️⃣ Check cookie
  const cookies = Req.getCookies(req);
  if (cookies && cookies[tokenNames.cookie]) {
    return cookies[tokenNames.cookie];
  }

  // 2️⃣ Check header (support 'Bearer <token>')
  const authHeader = req?.headers?.[tokenNames.header?.toLowerCase()];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      return parts[1];
    }
    return authHeader;
  }

  // 3️⃣ Check query string
  const query = Req.getQuery(req);
  if (query && query[tokenNames.query]) {
    return query[tokenNames.query];
  }

  return undefined;
}




  /**
   * Enforce allowed HTTP methods on a request.
   *
   * Accepts a single method, multiple comma/space-separated string, or array of methods.
   * If the request method is not allowed, responds with 405 Method Not Allowed and sets the Allow header.
   *
   * Examples:
   * ```js
   * Outpost.enforceMethod('GET', req, res);
   * Outpost.enforceMethod('GET,POST', req, res);
   * Outpost.enforceMethod(['GET', 'POST', 'PUT'], req, res);
   * ```
   *
   * @param {string|string[]} methodOrMethods - Allowed HTTP method(s)
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @returns {boolean} True if method allowed, false if disallowed
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
