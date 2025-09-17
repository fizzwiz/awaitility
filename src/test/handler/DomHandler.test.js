import { JSDOM } from "jsdom";
import assert from "assert";
import { DomHandler } from "../../main/handler/DomHandler.js";

describe("DomHandler", function () {
  let dom;
  let container;
  let handler;

  beforeEach(function () {
    dom = new JSDOM(`
      <div id="root">
        <div id="container">
          <span class="item">Original</span>
        </div>
      </div>
    `);
    container = dom.window.document.getElementById("root");
    handler = new DomHandler(container);
  });

  it("withQuery navigates to child element", function () {
    handler.withQuery("#container > .item");
    assert.strictEqual(handler.ctx.tagName, "SPAN");
    assert.strictEqual(handler.ctx.textContent, "Original");
  });

  it("setText sets textContent synchronously", function () {
    handler.withQuery("#container > .item").setText("Hello");
    assert.strictEqual(handler.ctx.textContent, "Hello");
  });

  it("setHTML sets innerHTML synchronously", function () {
    handler.withQuery("#container").setHTML("<p>New</p>");
    assert.strictEqual(handler.ctx.innerHTML, "<p>New</p>");
  });

  it("setAttr sets attribute synchronously", function () {
    handler.withQuery("#container > .item").setAttr("data-test", "123");
    assert.strictEqual(handler.ctx.getAttribute("data-test"), "123");
  });

  it("asyncSetText sets textContent asynchronously", async function () {
    await handler.withQuery("#container > .item").asyncSetText(async () => "Async Hello");
    assert.strictEqual(handler.ctx.textContent, "Async Hello");
  });

  it("asyncSetHTML sets innerHTML asynchronously", async function () {
    await handler.withQuery("#container").asyncSetHTML(async () => "<b>Async</b>");
    assert.strictEqual(handler.ctx.innerHTML, "<b>Async</b>");
  });

  it("asyncSetAttr sets attribute asynchronously", async function () {
    await handler.withQuery("#container > .item").asyncSetAttr("title", async () => "Async Title");
    assert.strictEqual(handler.ctx.getAttribute("title"), "Async Title");
  });

  it("handles errors gracefully with asyncExec", async function () {
    let errorCalled = false;
    const onError = () => { errorCalled = true; };
    const h = new DomHandler(container, { message: "fail" }, onError);

    await h.withQuery("#nonexistent").asyncSetText("test");
    assert.strictEqual(h.ok, false);
    assert.strictEqual(errorCalled, true);
  });

  it("chainable API works", async function () {
    await handler.withQuery("#container > .item").asyncSetText("First");
    await handler.asyncSetAttr("data-x", "42");
  
    assert.strictEqual(handler.ctx.textContent, "First");
    assert.strictEqual(handler.ctx.getAttribute("data-x"), "42");
  });
  
});
