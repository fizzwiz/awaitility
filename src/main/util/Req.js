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

  static prepareToken(req, tokenNames = { cookie: 'token', header: 'Authorization', query: 'token' }) {
    if (!req.token) req.token = this.getToken(req, tokenNames);
    return true;
  }

  /**
   * Parse the request body.
   * Returns JSON object if `Content-Type` is JSON, parsed form if urlencoded, raw string otherwise.
   * @param {IncomingMessage|Object} req
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
   * Enforce allowed HTTP methods.
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
