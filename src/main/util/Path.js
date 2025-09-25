import { AsyncEach } from "../../../../fluent/src/main/core/AsyncEach.js";
import { Req } from "./Req.js";

/**
 * Utility class for normalizing and checking URL paths.
 */
export class Path {
    /**
     * Normalizes a URL path:
     * - Decodes URI components
     * - Collapses multiple slashes into one
     * - Ensures leading slash
     * - Removes trailing slash except for root "/"
     *
     * @param {string} path - The input path string.
     * @returns {string} The normalized path.
     */
    static normalize(path) {
      if (typeof path !== 'string' || !path.trim()) return '/';
  
      try {
        // Decode URI components and replace multiple slashes with one
        let decoded = decodeURIComponent(path).replace(/\/{2,}/g, '/');
  
        // Ensure leading slash
        if (!decoded.startsWith('/')) {
          decoded = '/' + decoded;
        }
  
        // Remove trailing slash if longer than 1 (except root "/")
        if (decoded.length > 1 && decoded.endsWith('/')) {
          decoded = decoded.slice(0, -1);
        }
  
        return decoded || '/';
      } catch {
        // Return root on decode errors
        return '/';
      }
    }
  

/**
 * Checks if the given `base` path is the base of the `target` path.
 *
 * A path is considered the base if:
 *   1. `base` is `'/'` (root),
 *   2. `base` is exactly equal to `target`, or
 *   3. `target` starts with `base` followed by a slash (child route).
 *
 * ⚠️ Paths should be normalized (trailing slashes removed) before calling
 *
 * @example
 * Path.isBase('/', '/admin')           // true
 * Path.isBase('/admin', '/admin')      // true
 * Path.isBase('/admin', '/admin/')     // true
 * Path.isBase('/admin', '/admin/settings') // true
 * Path.isBase('/admin', '/administrator')  // false
 *
 * @param {string} base - The base path (e.g., '/admin') 
 * @param {string} target - The target path to check (e.g., '/admin/settings') 
 * @returns {boolean} True if `base` is the base path of `target`, false otherwise.
 */
static isBase(base, target) {
  return base === '/' || base === target || target.startsWith(base + '/');
}

/**
 * Generator of all the subpaths of a given path
 * @param {string} path
 */
static *subpaths(path) {
  path = path.trim();

  if (path === "/") {
    yield path;
    return;
  }

  const prepend = path.startsWith('/')? '/': '';
  const parts = path.split("/");
  let current;
  for (let part of parts) {
    current = current ? current + "/" + part : part;
    yield prepend + current;
  }

}

static route(app, method, path, handler) {
  const m = method.toUpperCase();

  // Express / Connect
  if (app && typeof app[m.toLowerCase()] === 'function') {
    app[m.toLowerCase()](path, async (req, res, next) => {
      try {
        await handler(req, res);
      } catch (err) {
        next(err);
      }
    });
    return;
  }

  // Fastify
  if (app && typeof app.route === 'function') {
    app.route({ method: m, url: path, handler });
    return;
  }

  // Koa
  if (app && typeof app.use === 'function' && Array.isArray(app.middleware)) {
    app.use(async (ctx, next) => {
      if (ctx.method.toUpperCase() === m && ctx.path === path) {
        try {
          await handler(ctx.req, ctx.res);
          ctx.respond = false;
        } catch (err) {
          ctx.status = 500;
          ctx.body = { error: err.message };
        }
      } else {
        await next();
      }
    });
    return;
  }

  // Raw HTTP server
  if (app && typeof app.on === 'function') {
    app.on('request', async (req, res) => {
      const reqPath = new URL(req.url, `http://${req.headers.host}`).pathname;
      if (req.method.toUpperCase() === m && reqPath === path) {
        try {
          await Req.prepare(req, res);
          await handler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.end(err.message);
        }
      }
    });
    return;
  }

  throw new Error('Unsupported application framework');
}

 /**
 * Gets a nested property.
 *
 * @param {object} obj - The root object.
 * @param {string | Iterable<string>} keys Path to property as string or iteration of strings.
 * @returns {Promise<any>} The nested property, or undefined if path not found.
 */
static get(obj, keys) {
  keys = Path.keys(keys);

  let current = obj;
  for (const key of keys) {
    if (current == null || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}


/**
 * Sets a nested property.
 *
 * @param {object} obj - The root object.
 * @param {string | Iterable<string>} keys Path to property as string or iteration of strings.
 * @param {any} value - The value to set.
 * @param {boolean} [creating=false] - If true, creates missing objects along the path.
 * @returns {Promise<void>}
 */
static set(obj, keys, value, creating = false) {
  keys = Path.keys(keys);
  if (!keys.length) {
    throw new Error("Invalid path: empty keys");
  }

  let current = obj;
  let i = 0;
  for (const key of keys.slice(0, -1)) {
    if (!(key in current)) {
      if (!creating) {
        throw new Error(`nonexistent path: ${keys.slice(0, i + 1).join('.')}`);
      }
      current[key] = {};
    }
    current = current[key];
    i++;
  }

  current[keys[keys.length - 1]] = value;
}

static delete(obj, keys) {
  keys = Path.keys(keys);
  const ctx = Path.get(obj, keys.slice(0, -1));
  delete ctx[keys[keys.length - 1]];
}


/**
 * Normalize keys into a flat array of strings.
 *
 * Accepts:
 * - Dot-separated string (e.g. `"user.profile"`)
 * - Array of strings or promises
 * - Promise resolving to string or array
 * - Iterable / AsyncIterable of strings or promises
 *
 * @param {string | Iterable<string>} keys Path to property as string or iteration of strings.
 * @returns {Promise<string[]>} A Promise resolving to a flat array of keys.
 *
 * @example
 * await Path.keys("user.profile"); // → ["user", "profile"]
 * await Path.keys(["user", Promise.resolve("profile")]); // → ["user", "profile"]
 */
static keys(input) {

  if (typeof input === "string") {
    return input.split(".").filter(Boolean);
  }

  return [...input];
}

/**
 * Tests whether path `aa` is an ancestor of path `bb`.
 * Example:
 *   ["user"] is ancestor of ["user", "profile"]
 *
 * @param {string|string[]} aa - candidate ancestor path
 * @param {string|string[]} bb - candidate descendant path
 * @returns {boolean}
 */
static isAncestor(aa, bb) {
  const kka = Path.keys(aa);
  const kkb = Path.keys(bb);

  if (kka.length > kkb.length) return false;

  for (let i = 0; i < kka.length; i++) {
    if (kka[i] !== kkb[i]) return false;
  }
  return true;
}



}