# ⏳ @fizzwiz/awaitility

> Essential utilities for asynchronous workflows.

---

## 🌐 Overview

`@fizzwiz/awaitility` provides **chainable, context-aware handlers** for general data, DOM manipulation, and HTTP workflows. It simplifies **asynchronous operations**, **nested context navigation**, and **error handling**, offering a clean, fluent API.

Business logic remains in focus: main operations are expressed as top-level code, while **errors are thrown** and can be handled via `.else()`.

---

## ⚡ Features

* 🛠 **Handler**: Base class for chainable asynchronous operations.
* 🌳 **DomHandler**: Chainable DOM navigation and async mutation.
* 📡 **HttpHandler**: Simplified HTTP request/response handling.
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

const data = { user: { name: "Alice", age: 25 } };

// Main business logic: declared first
const business = ctx => {
  ctx.user.age += 1;
  return ctx;
};

// Decorate the main business logic with checks and error handling
const h = Handler.as(business)
  .checking("user.age")     // Pre-execution check: throws if property not defined
  .else((ctx, err) => console.error("❌ Error caught:", err));

const result = await h(data);
console.log("✅ Updated context:", result); // { name: "Alice", age: 26 }
```

---

### 🌳 DomHandler

```html
<script type="module">
import { DomHandler } from "@fizzwiz/awaitility";

const business = async ctx => {
  console.log("💻 Business logic running on", ctx);
  return ctx;
};

const validator = html => html.includes("snippet");

const h = DomHandler.as(business)
  .setting("body.innerHTML", async () => fetch("/snippet.html").then(r => r.text()))
  .check("body.innerHTML", validator)
  .else((ctx, err) => console.error("❌ Error caught:", err));

await h(document);
</script>
```

---

### 📡 HttpHandler

```js
import { HttpHandler, Res } from "@fizzwiz/awaitility";

const business = async ctx => {
  console.log("💻 Business logic running with HTTP context:", ctx.req);
  return ctx;
};

const validator = token => typeof token === "string" && token.length > 0;

const h = HttpHandler.as(business)
  .preparingToken()
  .check("req.token", validator)
  .else((ctx, err) => {
    console.error("❌ Error caught:", err);
    Res.json(ctx.res, 401, { error: err.message });
  });

await h({ req, res });
```

---

## 📚 API Reference

### 🛠 Handler

* `with(path, creating = true, error?)` – Navigate into a nested object.
* `without(nsteps = 1)` – Step back in the path stack.
* `setting/set(path, value, creating = true, error?)` – Set property.
* `checking/check(path, validator?, error?)` – Check property.

### 🌳 DomHandler

* Extends `Handler`.
* `with(selector, isQuery?, creating?, error?)` – Navigate DOM element by CSS selector.
* `setting/setAttr(attr, value, error?)` – Set attribute (pre/post execution).
* `checking/checkAttr(attr, validator?, error?)` – Check attribute (pre/post execution).

### 📡 HttpHandler

* Extends `Handler`.
* `preparing/prepareURL()` `preparing/prepareBody()`, `preparing/prepareQuery()`, `preparing/prepareCookies()`, `preparing/prepareToken()`
* Errors are **thrown** and can be caught with `.else()`.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome! Open issues or pull requests on [GitHub](https://github.com/fizzwiz/awaitility).

---

## 📝 License

MIT © 2025 Fizzwiz
