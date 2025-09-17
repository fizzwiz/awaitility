# ⏳ @fizzwiz/awaitility

> Essential utilities for asynchronous workflows.

---

## 🌐 Overview

`@fizzwiz/awaitility` provides a set of **chainable, context-aware handlers** for general data structures, DOM manipulation, and HTTP workflows.
It simplifies **asynchronous operations**, **nested context navigation**, and **error handling**, offering a clean, fluent API.

---

## ⚡ Features

* **Handler**: Base class for chainable operations with synchronous and asynchronous checks.
* **DomHandler**: Chainable DOM navigation and async mutation.
* **HttpRequestHandler**: Simplified HTTP request/response handling.
* **Async**: Utilities for asynchronous workflows.
* **Req / Res**: Minimal request and response utilities.
* **Path**: Utilities for working with nested objects or URLs.

---

## 📦 Installation

```bash
npm install @fizzwiz/awaitility
```

---

## 🚀 Usage

### Handler

```js
import { Handler } from "@fizzwiz/awaitility";

const data = { user: { name: "Alice" } };
const defaultError = { message: "handler-fail" };
const handler = new Handler(data, defaultError);

handler
  .with("user")
  .check(ctx => ctx.name === "Alice", { message: "wrong-name" })
  .set("age", 30)
  .on('handler-fail', ...)
  .on('handler-fail:wrong-name', ...);

console.log('✅ Context:', handler.ctx); // { name: "Alice", age: 30 }
```

### DomHandler

```js
import { DomHandler } from "@fizzwiz/awaitility";

const handler = new DomHandler(document);

await handler
  .withQuery("#container > span.item")
  .setAttr("data-id", "123")
  .asyncSetHTML(async () => fetch(url).then(res => res.text()), { message: 'fetch-html-fail' });

handler.on('fetch-html-fail', ...);
```

### HttpRequestHandler

```js
import { HttpRequestHandler } from "@fizzwiz/awaitility";

const handler = new HttpRequestHandler({ req, res });

handler
  .with('req')
  .check(req => req.url === "/api/users")
  .prepareToken({ message: "token-fail" })
  .on("token-fail", ...);
```

---

## 📚 API Reference

### Handler

* `with(path, error?, onError?, creating?)` - Navigate into a nested object.
* `without(nsteps?)` - Step back in the path stack.
* `get(path?, creating?)` - Get a nested property.
* `set(path, value, error?, onError?, creating?)` - Set a property.
* `asyncSet(path, value, error?, onError?, creating?)` - Set a property asynchronously.
* `check(predicate, error?, onError?)` - Synchronous check.
* `asyncCheck(predicate, error?, onError?)` - Asynchronous check.
* `exec(fn, error?, onError?)` - Synchronous side-effect function.
* `asyncExec(fn, error?, onError?)` - Asynchronous side-effect function.
* `fail(err, cause?, onError?)` - Fail handler and emit enriched error.

### DomHandler

* Extends `Handler`.
* `withQuery(selector, error?, onError?)` - Navigate DOM element by CSS selector.
* `setText(value, error?, onError?)` - Set `textContent`.
* `setHTML(html, error?, onError?)` - Set `innerHTML`.
* `setAttr(attr, value, error?, onError?)` - Set attribute.
* Async equivalents: `asyncSetText`, `asyncSetHTML`, `asyncSetAttr`.

### HttpRequestHandler

* `prepareBody()`, `prepareQuery()`, `prepareToken()`, `checkMethod()`, `checkToken()`, `checkQueryParam()`, `checkCookie()`, `checkHeader()`, `checkContentType()`, `checkAccept()`
* By default, errors are converted into a `Notification` instance sent automatically to the client.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!
Please open issues or pull requests on the [GitHub repository](https://github.com/fizzwiz/awaitility).

---

## 📖 Tutorials and Learning

Check the 👉 [blog](http://awaitility-js.blogspot.com) for tutorials and in-depth examples.

---

## 📝 License

MIT © 2025 Fizzwiz
