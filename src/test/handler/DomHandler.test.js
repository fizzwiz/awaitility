import { strict as assert } from "assert";
import { JSDOM } from "jsdom";
import { DomHandler } from "../../main/handler/DomHandler.js"; // adjust path
import { DomError } from "../../main/error/DomError.js";

describe("DomHandler", () => {
  let dom, document, div;

  beforeEach(() => {
    dom = new JSDOM(`<div id="container" data-test="foo"></div>`);
    document = dom.window.document;
    div = document.getElementById("container");
  });

  it("should set a DOM attribute pre-execution (settingAttr)", async () => {
    const handler = DomHandler.as()
      .settingAttr("data-test", "bar");

    const ctx = await handler(div);
    assert.equal(div.getAttribute("data-test"), "bar");
    assert.equal(ctx, div); // ctx is returned
  });

  it("should set a DOM attribute post-execution (setAttr)", async () => {
    const handler = DomHandler.as()
      .setAttr("data-test", "baz");

    const ctx = await handler(div);
    assert.equal(div.getAttribute("data-test"), "baz");
    assert.equal(ctx, div);
  });

  it("should throw DomError if context is not a DOM element", async () => {
    const handler = DomHandler.as()
      .setAttr("data-test", "baz");

    await assert.rejects(
      async () => handler({}), 
      err => err instanceof DomError && err.message.includes("Not a DOM element")
    );
  });

  it("should navigate into a DOM node using CSS query", async () => {
    const parent = document.createElement("div");
    parent.innerHTML = `<span class="child">Hello</span>`;
    const child = parent.querySelector(".child");

    const handler = DomHandler.as()
      .with(".child", true); // CSS query

    const ctx = await handler(parent);
    assert.equal(child.textContent, "Hello");
    assert.equal(ctx.querySelector(".child").textContent, "Hello");
  });

  it("should fallback to base Handler.with() for path-based navigation", async () => {
    const ctx = { nested: { el: div } };
    const handler = DomHandler.as()
      .with("nested.el"); // path-based

    const result = await handler(ctx);
    assert.equal(result.nested.el, div);
  });
});
