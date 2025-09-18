# ⏳ @fizzwiz/awaitility

> Essential utilities for asynchronous workflows.

---

## 🌐 Overview

`@fizzwiz/awaitility` provides a set of **chainable, context-aware handlers** for general data structures, DOM manipulation, and HTTP workflows.
It simplifies **asynchronous operations**, **nested context navigation**, and **error handling**, offering a clean, fluent API.

This library is designed to **keep business logic in focus**: your main operations are expressed as top-level code, while **error handling is nested and orthogonalized** into listeners or automatically managed (e.g., by `Servler`).

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

const h = new Handler(data, defaultError)
  .on("handler-fail", err => /* handle general failure */)
  .on("handler-fail:wrong-name", err => /* handle specific failure */)
  .with("user")
  .check(ctx => ctx.name === "Alice", { message: "wrong-name" })  // Second argument = error thrown if the predicate fails
  .set("age", 30);

// Errors are handled by listeners
if (!h.ok) return;

// Business logic in focus here
console.log("✅ Context:", h.ctx); // { name: "Alice", age: 30 }
```

---

### 🌳 Domler

```html
<script type="module">
  import { Domler } from "@fizzwiz/awaitility";

  async function handler(event) {
    const h = new Domler(document)
      .on("fetch-html-fail", err => /* handle fetch failure */)
      .withQuery("#container")
      .setAttr("data-id", "123");

    await h.asyncSetHTML(
      async () => fetch("/snippet.html").then(res => res.text()),
      { message: "fetch-html-fail" }
    );

    // Errors are handled by listeners
    if (!h.ok) return;

    // Business logic in focus here
  }
</script>
```

---

### 📡 Servler

```js
import { Servler, Res } from "@fizzwiz/awaitility";

// Example: a framework-agnostic route handler
async function handler(req, res) {
  const h = new Servler({ req, res });

  h
    .checkMethod("POST")
    .checkContentType(/application\/json/)   // Require JSON body
    .checkAccept(/application\/json/)       // Client must accept JSON
    .prepareQuery()                          // Attach req.query if missing
    .prepareCookies();                       // Attach req.cookies if missing

  // Attach req.body (async operation) if missing
  await h.prepareBody();   

  // Errors are auto-converted to Notifications and sent to the client
  if (!h.ok) return;

  // Business logic in focus here
  const result = { success: true };

  // Send JSON response
  Res.json(res, 200, result);
}
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
