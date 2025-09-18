# ⏳ @fizzwiz/awaitility

> Essential utilities for asynchronous workflows.

---

## 🌐 Overview

`@fizzwiz/awaitility` provides a set of **chainable, context-aware handlers** for general data structures, DOM manipulation, and HTTP workflows.
It simplifies **asynchronous operations**, **nested context navigation**, and **error handling**, offering a clean, fluent API.

---

## ⚡ Features

* 🛠 **Handler**: Base class for chainable operations with synchronous and asynchronous checks.
* 🌳 **Domler**: Chainable DOM navigation and async mutation.
* 📡 **Servler**: Simplified HTTP request/response handling.
* ⏱ **Async**: Utilities for asynchronous workflows.
* 📨 **Req / Res**: Minimal request and response utilities.
* 🗂 **Path**: Utilities for working with nested objects or URLs.

---

## 📦 Installation

```bash
npm install @fizzwiz/awaitility
```

---

## 🚀 Usage

### 🛠 Handler

```js
import { Handler } from "@fizzwiz/awaitility";

const data = { user: { name: "Alice" } };
const defaultError = { message: "handler-fail" };

const handler = new Handler(data, defaultError)
  .on('handler-fail', ...)
  .on('handler-fail:wrong-name', ...);
  .with("user")
  .check(ctx => ctx.name === "Alice", { message: "wrong-name" })  // Passes a specific error object as the second argument
  .set("age", 30)
  

console.log('✅ Context:', handler.ctx); // { name: "Alice", age: 30 }
```

### 🌳 Domler

```js
import { Domler } from "@fizzwiz/awaitility";

const handler = new Domler(document)
  .on('fetch-html-fail', ...);
  .withQuery("#container")
  .setAttr("data-id", "123");

await handler.asyncSetHTML(
    async () => fetch(url).then(res => res.text()), 
    { message: 'fetch-html-fail' }
);
```

### 📡 Servler

```js
import { Servler } from "@fizzwiz/awaitility";

const handler = new Servler({ req, res })
  .on("check-fail", ...)
  .on("prepare-token-fail", ...);
  .with('req')
  .check(req => req.url === "/api/user")   // Second argument defaults to the error { message: "check-fail" }
  .prepareToken()                           // Second argument defaults to the error { message: "prepare-token-fail" }

```

---

## 📚 API Reference

### 🛠 Handler

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

### 🌳 Domler

* Extends `Handler`.
* `withQuery(selector, error?, onError?)` - Navigate DOM element by CSS selector.
* `setText(value, error?, onError?)` - Set `textContent`.
* `setHTML(html, error?, onError?)` - Set `innerHTML`.
* `setAttr(attr, value, error?, onError?)` - Set attribute.
* Async equivalents: `asyncSetText`, `asyncSetHTML`, `asyncSetAttr`.

### 📡 Servler

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
