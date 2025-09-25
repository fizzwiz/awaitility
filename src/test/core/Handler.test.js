import { strict as assert } from "assert";
import { describe, it } from "mocha";
import { Handler } from "../../main/core/Handler.js"; 

describe("Handler", () => {

  it("should execute a pre-check and pass context if valid", async () => {
    const ctx = { user: { password: "1234" } };
    const handler = Handler.as().checking("user.password", v => v === "1234");
    const result = await handler(ctx);
    assert.deepEqual(result, ctx);
  });

  it("should throw an error if post-check fails", async () => {
    const ctx = { user: { password: "" } };
    const handler = Handler.as().check("user.password", v => v.length > 0, new Error('Handler.check: validation failed for "user.password"')  );

    await assert.rejects(
      handler(ctx),
      /Handler\.check: validation failed for "user\.password"/
    );
  });

  it("should set a property before execution", async () => {
    const ctx = { user: {} };
    const handler = Handler.as().setting("user.name", "Alice");
    const result = await handler(ctx);
    assert.equal(result.user.name, "Alice");
  });

  it("should set a property after execution and respect with()/without()", async () => {
    const ctx = {};
    const handler = Handler.as()
      .with("user")
      .set("name", "Bob")
      .without(); // remove the context step

    const result = await handler(ctx);

    // The value should be under 'user'
    assert.deepEqual(result.user, { name: "Bob" });

    // Meta context stack should be removed
    assert.equal(result[handler.metaCtx]?.length, undefined);
  });

  it("should navigate nested context for post-exec methods only", async () => {
    const ctx = {};
    const handler = Handler.as()
      .with("user.profile")
      .set("name", "Charlie")
      .without();

    const result = await handler(ctx);

    // Value should be properly nested
    assert.deepEqual(result.user.profile, { name: "Charlie" });

    // Meta context stack cleared
    assert.equal(result[handler.metaCtx]?.length, undefined);
  });

  it("should throw if with() fails and creating=false", async () => {
    const ctx = {};
    const handler = Handler.as().with("user.profile", false, new Error('Handler.with: path "user.profile" does not exist'));

    await assert.rejects(
      handler(ctx),
      /Handler\.with: path "user\.profile" does not exist/
    );
  });

});
