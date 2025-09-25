import assert from "assert";
import { Handler } from "./main/core/Handler.js";

console.log(!!'');

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