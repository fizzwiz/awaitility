import { AsyncWhat } from "@fizzwiz/fluent";
import { Path } from "../util/Path.js";

/**
 * Handler
 * -------
 * Chainable, context-aware async handler for property validation and transformations.
 * Throws errors directly; `.else()` can handle them later.
 *
 * @extends AsyncWhat
 */
export class Handler extends AsyncWhat {
  /** @type {string} */
  static metaCtx = '_hMeta';

  static as(business = ctx => ctx, prototype = Handler.prototype) {
    const got = AsyncWhat.as(business);
    Object.setPrototypeOf(got, prototype);
    return got;
  }


  // --------------------------------------------------------------------------
  // Validation methods
  // --------------------------------------------------------------------------

  checking(prop, validator = async v => !!v, error) {
    return this.if(async ctx => {
      const ok = await validator(Handler.ctx(ctx, prop));
      if (!ok) throw error;
      return ctx;
    });
  }

  check(prop, validator = async v => !!v, error) {
    return this.sthen(async ctx => {
      const ok = await validator(Handler.ctx(ctx, prop));
      if (!ok) throw error;
      return ctx;
    });
  }

  // --------------------------------------------------------------------------
  // Setting methods
  // --------------------------------------------------------------------------

  setting(prop, value, creating = true, error) {
    return this.if(ctx =>
      Handler.doSet(ctx, prop, value, creating, error)
    );
  }

  set(prop, value, creating = true, error) {
    return this.sthen(ctx =>
      Handler.doSet(ctx, prop, value, creating, error)
    );
  }

  static async doSet(ctx, prop, value, creating = true, error) {
    try {
      const current = Handler.currentCtx(ctx);
      const resolved =
        typeof value === "function" ? await value(current) : await value;

      if (resolved === undefined) throw new Error('undefined result');

      Path.set(current, prop, resolved, creating);
      return ctx;
    } catch (cause) {
      throw error.clone?.(cause) || error || cause;
    }
  }

  // --------------------------------------------------------------------------
  // Context navigation
  // --------------------------------------------------------------------------

  with(path, creating = true, error) {
    return this.sthen(async ctx => {
      let stack = await Path.get(ctx, Handler.metaCtx);
      if (!stack) {
        stack = [];
        Path.set(ctx, Handler.metaCtx, stack);
      }

      const root = stack[stack.length - 1] || ctx;
      let current = Path.get(root, path);

      if (current === undefined) {
        if (creating) {
          current = {};
          Path.set(root, path, current, true);
        } else {
          throw error;
        }
      }

      stack.push(current);
      return ctx;
    });
  }

  without(nsteps = 1) {
    return this.sthen(async ctx => {
      let stack = await Path.get(ctx, Handler.metaCtx);
      if (Array.isArray(stack) && stack.length > 0) {
        const steps = Math.min(stack.length, nsteps);
        stack.splice(stack.length - steps, steps);
        if (!stack.length) Path.delete(ctx, Handler.metaCtx);
      }
      return ctx;
    });
  }

  // --------------------------------------------------------------------------
  // Context helpers
  // --------------------------------------------------------------------------

  static currentCtx(root) {
    const stack = Path.get(root, Handler.metaCtx);
    return stack?.at(-1) ?? root;
  }

  static ctx(root, prop) {
    const current = Handler.currentCtx(root);
    return Path.get(current, prop);
  }
}
