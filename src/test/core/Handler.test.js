import { describe, it, beforeEach } from 'mocha';
import assert from 'assert';
import { Handler } from '../../main/core/Handler.js';

describe('Handler', () => {
  let ctx;
  let handler;
  let calledErrors;

  beforeEach(() => {
    ctx = {};
    calledErrors = [];
    handler = new Handler(
      ctx,
      { message: 'default-error', code: 100 },
      (err, h) => calledErrors.push({ err, h })
    );
  });

  it('should perform check successfully on whole ctx', () => {
    let ran = false;
    handler.check(c => { ran = true; return true; });
    assert.strictEqual(ran, true);
    assert.strictEqual(handler.ok, true);
  });

  it('should fail check when predicate returns false', () => {
    let emitted;
    handler.on('default-error', err => emitted = err);
    handler.check(() => false);
    assert.strictEqual(handler.ok, false);
    assert.ok(emitted);
    assert.strictEqual(calledErrors.length, 1);
    assert.strictEqual(calledErrors[0].h, handler);
  });

  it('should set a nested path', () => {
    handler.set('a.b.c', 42);
    assert.strictEqual(ctx.a.b.c, 42);
    assert.strictEqual(handler.ok, true);
  });

  it('should get a nested path', () => {
    ctx.a = { b: { c: 123 } };
    const val = handler.get('a.b.c');
    assert.strictEqual(val, 123);
  });

  it('should enrich errors correctly', () => {
    const enriched = handler.enrich({ message: 'sub-error', code: 200 });
    assert.strictEqual(enriched.emitter, handler);
    assert.strictEqual(enriched.message, 'default-error:sub-error');
    assert.strictEqual(enriched.code, 200);
  });

  it('should emit enriched and default errors on fail', () => {
    let enrichedEvent, defaultEvent;
    handler.on('default-error:sub-error', err => enrichedEvent = err);
    handler.on('default-error', err => defaultEvent = err);

    handler.fail({ message: 'sub-error', code: 200 });
    assert.strictEqual(handler.ok, false);
    assert.ok(enrichedEvent);
    assert.ok(defaultEvent);
    assert.strictEqual(enrichedEvent.message, 'default-error:sub-error');
    assert.strictEqual(defaultEvent.message, enrichedEvent.message);  // the error is always enriched. Only the trigger message changes
  });

  it('should skip checks if already failed', () => {
    handler.ok = false;
    let ran = false;
    handler.check(() => { ran = true; return true; });
    assert.strictEqual(ran, false);
  });

  it('should navigate into nested context using with()', () => {
    ctx.a = { b: { c: 7 }, d: 42 };
    handler.with('a.b');
    assert.strictEqual(handler.ctx.c, 7);
    handler.without(); 
    assert.deepStrictEqual(handler.ctx, ctx);
  });

  it('should navigate back to parent context using without()', () => {
    ctx.a = { b: { c: 7 }, d: 42 };
    handler.with('a.b');
    assert.strictEqual(handler.ctx.c, 7);
    handler.without();
    assert.strictEqual(handler.ctx, ctx);
  });
  
  it('should set a direct async value', async () => {
    await handler.asyncSet('a', Promise.resolve(42));
    assert.strictEqual(ctx.a, 42);
    assert.ok(handler.ok);
  });

  it('should set a value returned by a function', async () => {
    await handler.asyncSet('b', () => 2, undefined, undefined, true);
    assert.strictEqual(ctx.b, 2); 
    assert.ok(handler.ok);
  });

  it('should set a value returned by an async function', async () => {
    await handler.asyncSet('c', async () => 2, undefined, undefined, true);
    assert.strictEqual(ctx.c, 2); 
    assert.ok(handler.ok);
  });

  it('should handle rejected promises', async () => {
    await handler.asyncSet('d', async () => { throw new Error('fail'); });
    assert.strictEqual(handler.ok, false);
    assert.ok(calledErrors.length > 0);
    assert.strictEqual(calledErrors[0].err.message, 'default-error');
  });

  it('should handle function throwing errors', async () => {
    await handler.asyncSet('x', () => { throw new Error('oops'); }, {message: 'func-error'});
    assert.strictEqual(handler.ok, false);
    assert.strictEqual(calledErrors[calledErrors.length - 1].err.message, 'default-error:func-error');
  });
  
});
