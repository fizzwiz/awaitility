import { strict as assert } from "assert";
import { describe, it } from "mocha";
import { Handler } from "../../main/core/Handler.js";
import { HttpHandler} from "../../main/handler/HttpHandler.js";
import { HttpError } from "../../main/error/HttpError.js";

describe("Handler", () => {

  it("should execute a pre-check and pass context if valid", async () => {
    const ctx = { user: { password: "1234" } };
    const handler = Handler.as().checking(
      "user.password",
      async v => !!v,
      new Error('pre-check failed for user.password')
    );
    const result = await handler(ctx);
    assert.deepEqual(result, ctx);
  });

  it("should throw an error if pre-check fails", async () => {
    const ctx = { user: { password: "" } };
    const handler = Handler.as().checking(
      "user.password",
      async v => v && v.length > 0,
      new Error('pre-check failed for user.password')
    );

    let caught = null;
    try {
      await handler(ctx);
    } catch (err) {
      caught = err;
    }

    assert.ok(caught instanceof Error);
    assert.equal(caught.message, "pre-check failed for user.password");
  });

  it("should execute a post-check and pass context if valid", async () => {
    const ctx = { user: { password: "abcd" } };
    const handler = Handler.as().check(
      "user.password",
      async v => !!v,
      new Error('post-check failed for user.password')
    );
    const result = await handler(ctx);
    assert.deepEqual(result, ctx);
  });

  it("should throw an error if post-check fails", async () => {
    const ctx = { user: { password: "" } };
    const handler = Handler.as().check(
      "user.password",
      async v => v && v.length > 0,
      new Error('post-check failed for user.password')
    );

    let caught = null;
    try {
      await handler(ctx);
    } catch (err) {
      caught = err;
    }

    assert.ok(caught instanceof Error);
    assert.equal(caught.message, "post-check failed for user.password");
  });

  it("should set a property before execution", async () => {
    const ctx = { user: {} };
    const handler = Handler.as().setting(
      "user.name",
      "Alice",
      true,
      new Error('setting failed for user.name')
    );
    const result = await handler(ctx);
    assert.equal(result.user.name, "Alice");
  });

  it("should throw if pre-set value resolves to undefined", async () => {
    const ctx = { user: {} };
    const handler = Handler.as().setting(
      "user.name",
      () => undefined,
      true,
      new Error('setting failed for user.name')
    );

    let caught = null;
    try {
      await handler(ctx);
    } catch (err) {
      caught = err;
    }

    assert.ok(caught instanceof Error);
    assert.equal(caught.message, "setting failed for user.name");
  });

  it("should navigate nested context with with() and without()", async () => {
    const ctx = {};
    const handler = Handler.as()
      .with("user.profile", true, new Error('path not found'))
      .set("name", "Charlie", true, new Error('set failed'))
      .without();

    const result = await handler(ctx);
    assert.deepEqual(result.user.profile, { name: "Charlie" });
    assert.equal(result[handler.metaCtx]?.length, undefined);
  });

  it("should throw if with() fails and creating=false", async () => {
    const ctx = {};
    const handler = Handler.as().with(
      "user.profile",
      false,
      new Error('path missing')
    );

    let caught = null;
    try {
      await handler(ctx);
    } catch (err) {
      caught = err;
    }

    assert.ok(caught instanceof Error);
    assert.equal(caught.message, "path missing");
  });

});

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

});
