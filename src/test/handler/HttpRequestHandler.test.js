import { strict as assert } from 'assert';
import { HttpRequestHandler } from '../../main/handler/HttpRequestHandler.js';

// Mock Req and Res utils
const mockReq = (overrides = {}) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: overrides.body,
  query: overrides.query || { id: '123' },
  cookies: overrides.cookies || { session: 'abc' },
  ...overrides
});

const mockRes = () => ({
  headersSent: false,
  statusCode: null,
  jsonBody: null,
  setHeader(name, val) {},
  end(body) { 
    try { this.jsonBody = JSON.parse(body); } catch(e) {} 
  }
});

describe('HttpRequestHandler', () => {

  it('should parse body asynchronously', async () => {
    const req = mockReq({ body: { foo: 'bar' } });
    const res = mockRes();
    const handler = new HttpRequestHandler({ req, res });

    await handler.prepareBody();
    assert.deepEqual(req.body, { foo: 'bar' });
    assert.ok(handler.ok);
  });

  it('should parse query and cookies synchronously', () => {
    const req = mockReq({ query: { id: '42' }, cookies: { token: 'abc' } });
    const res = mockRes();
    const handler = new HttpRequestHandler({ req, res });

    handler.defaultOnError = handler.constructor.defaultOnError;

    handler.prepareQuery().prepareCookies();
    assert.deepEqual(req.query, { id: '42' });
    assert.deepEqual(req.cookies, { token: 'abc' });
    assert.ok(handler.ok);
  });

  it('should check method successfully', () => {
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    const handler = new HttpRequestHandler({ req, res });

    handler.checkMethod('GET', 'POST');
    assert.ok(handler.ok);
  });

  it('should fail check for method', () => {
    const req = mockReq({ method: 'DELETE' });
    const res = mockRes();
    let captured;

    const handler = new HttpRequestHandler({ req, res });
    handler.defaultOnError = (err) => { captured = err; };

    handler.checkMethod('GET', 'POST');
    assert.ok(!handler.ok);
    assert.ok(captured);
    assert.strictEqual(captured.message, 'handler-fail:method-check');
  });

  it('should validate token', () => {
    const req = mockReq({ token: 'Bearer 123' });
    const res = mockRes();
    const handler = new HttpRequestHandler({ req, res });

    handler.checkToken(token => token === 'Bearer 123');
    assert.ok(handler.ok);
  });

  it('should fail invalid token', () => {
    const req = mockReq({ token: 'wrong' });
    const res = mockRes();
    let captured;

    const handler = new HttpRequestHandler({ req, res });
    handler.defaultOnError = (err) => { captured = err; };

    handler.checkToken(token => token === 'Bearer 123');
    assert.ok(!handler.ok);
    assert.ok(captured);
    assert.strictEqual(captured.message, 'handler-fail:token-check');
  });

  it('should check query param', () => {
    const req = mockReq({ query: { id: '42' } });
    const res = mockRes();
    const handler = new HttpRequestHandler({ req, res });

    handler.checkQueryParam('id', val => val === '42');
    assert.ok(handler.ok);
  });

  it('should fail missing query param', () => {
    const req = mockReq({ query: {} });
    const res = mockRes();
    let captured;

    const handler = new HttpRequestHandler({ req, res });
    handler.defaultOnError = (err) => { captured = err; };

    handler.checkQueryParam('id', Boolean);
    assert.ok(!handler.ok);
    assert.ok(captured);
    assert.strictEqual(captured.message, 'handler-fail:query-param:id-check');
  });

  it('should chain multiple checks', () => {
    const req = mockReq({ body: { foo: 1 }, query: { id: 'x' }, cookies: { token: 'abc' }, method: 'POST', token: 'xyz' });
    const res = mockRes();
    const handler = new HttpRequestHandler({ req, res });

    handler
      .checkMethod('POST')
      .checkQueryParam('id', id => id === 'x')
      .checkCookie('token', t => t === 'abc')
      .checkToken(t => t === 'xyz');

    assert.ok(handler.ok);
  });

});
