import { strict as assert } from "assert";
import { describe, it } from "mocha";
import { Handler } from "../../main/core/Handler.js";
import { HttpHandler} from "../../main/handler/HttpHandler.js";
import { HttpError } from "../../main/error/HttpError.js";

describe("HttpHandler", () => {

  it("should prepare the request body successfully", async () => {
    const ctx = { req: { body: { name: "Alice" } } };
    const handler = HttpHandler.as().preparingBody();
    const result = await handler(ctx);
    assert.deepEqual(result, ctx);
  });

  it("should throw HttpError for missing body", async () => {
    const ctx = { req: {} };
    const handler = HttpHandler.as().preparingBody(
      new HttpError(422, "missing body")
    );

    let caught = null;
    try {
      await handler(ctx);
    } catch (err) {
      caught = err;
    }

    assert.ok(caught instanceof HttpError);
    assert.equal(caught.statusCode, 422);
    assert.equal(caught.message, "missing body");
  });

  it("should prepare query successfully", async () => {
    const ctx = { req: { url: "/api/test?foo=bar" } };
    const handler = HttpHandler.as().preparingQuery();
    const result = await handler(ctx);
    assert.deepEqual(result.req.query, { foo: "bar" });
  });

  it("should prepare cookies successfully", async () => {
    const ctx = { req: { headers: { cookie: "token=abc123; theme=dark" } } };
    const handler = HttpHandler.as().preparingCookies();
    const result = await handler(ctx);
    assert.deepEqual(result.req.cookies, { token: "abc123", theme: "dark" });
  });

  it("should prepare token successfully from cookie", async () => {
    const ctx = { req: { headers: { cookie: "token=abc123" } } };
    const handler = HttpHandler.as().preparingToken();
    const result = await handler(ctx);
    assert.equal(result.req.token, "abc123");
  });

  it("should throw HttpError for missing token", async () => {
    const ctx = { req: { headers: {} } };
    const handler = HttpHandler.as().preparingToken(
      new HttpError(401, "no token")
    );

    let caught = null;
    try {
      await handler(ctx);
    } catch (err) {
      caught = err;
    }

    assert.ok(caught instanceof HttpError);
    assert.equal(caught.statusCode, 401);
    assert.equal(caught.message, "no token");
  });

  it("should set a property before execution", async () => {
    const ctx = { user: {} };
    const handler = HttpHandler.as().setting("user.name", "Alice");
    const result = await handler(ctx);
    assert.equal(result.user.name, "Alice");
  });

  it("should set a property after execution", async () => {
    const ctx = { user: {} };
    const handler = HttpHandler.as().set("user.name", "Bob");
    const result = await handler(ctx);
    assert.equal(result.user.name, "Bob");
  });

  it("should navigate nested context with with() and without()", async () => {
    const ctx = {};
    const handler = HttpHandler.as()
      .with("user.profile")
      .set("name", "Charlie")
      .without();

    const result = await handler(ctx);
    assert.deepEqual(result.user.profile, { name: "Charlie" });
    assert.equal(result[handler.metaCtx]?.length, undefined);
  });

  it("should throw if method is invalid", async () => {
    const ctx = { req: { method: "GET" } };
    const handler = HttpHandler.as().checkingMethod("POST");
  
    let caught = null;
    try {
      await handler(ctx);
    } catch (err) {
      caught = err;
    }
  
    assert.ok(caught instanceof Error);
    assert.equal(caught.message, "Invalid HTTP method");
  });
  
  it("should throw if content-type is invalid", async () => {
    const ctx = { req: { headers: { "content-type": "text/plain" } } };
    const handler = HttpHandler.as().checkingContentType("application/json");
  
    let caught = null;
    try {
      await handler(ctx);
    } catch (err) {
      caught = err;
    }
  
    assert.ok(caught instanceof Error);
    assert.equal(caught.message, "Invalid Content-Type");
  });
  
  it("should throw if Accept header is invalid", async () => {
    const ctx = { req: { headers: { accept: "text/html" } } };
    const handler = HttpHandler.as().checkingAccept("application/json");
  
    let caught = null;
    try {
      await handler(ctx);
    } catch (err) {
      caught = err;
    }
  
    assert.ok(caught instanceof Error);
    assert.equal(caught.message, "Not Acceptable");
  });
  
  it("should pass if method, content-type, and accept are valid", async () => {
    const ctx = {
      req: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
      },
    };
    const handler = HttpHandler.as()
      .checkingMethod("POST")
      .checkingContentType("application/json")
      .checkingAccept("application/json");
  
    const result = await handler(ctx);
    assert.deepEqual(result, ctx);
  });
  
});
