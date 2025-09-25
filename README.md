# ⏳ @fizzwiz/awaitility

> Essential utilities for asynchronous workflows.

---

## 🌐 Overview

`@fizzwiz/awaitility` provides **chainable, context-aware handlers** for general data, DOM manipulation, and HTTP workflows.
It simplifies **asynchronous operations**, **nested context navigation**, and **error handling**, offering a clean, fluent API.

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
  // some computation
  ctx.user.age += 1;
  return ctx;
};

// Decorate the main business logic with checks and error handlings
const h = Handler.as(business)
  // Pre-execution check: happens BEFORE the business logic runs
  .checking("user.age")     // throws if the property is not defined
  .else((ctx, err) => console.error("❌ Error caught:", err));

// The handler is just an asynchronous function
const result = await h(data);

console.log("✅ Updated context:", result); // Output: { name: "Alice", age: 26 }

```

---

### 🌳 DomHandler

```html
<script type="module">
import { DomHandler } from "@fizzwiz/awaitility";

const business = async ctx => {
  // main computation with DOM context
  console.log("💻 Business logic running on", ctx);
  return ctx;
};

const validator = html => html.includes("snippet"); // example validator

const h = DomHandler.as(business)
  // pre-execution setting: fetch HTML and set it to body.innerHTML
  .setting("body.innerHTML", async () => fetch("/snippet.html").then(r => r.text()))
  // post-execution check: verify the content
  .check("body.innerHTML", validator)
  // centralized error handling
  .else((ctx, err) => console.error("❌ Error caught:", err));

await h(document);

</script>
```

---

### 📡 HttpHandler

```js
import { HttpHandler, Res } from "@fizzwiz/awaitility";

// Main computation
const business = async ctx => {
  console.log("💻 Business logic running with HTTP context:", ctx.req);
  return ctx;
};

// Validator for the token
const validator = token => typeof token === "string" && token.length > 0;

const h = HttpHandler.as(business)
  // pre-execution: ensure req.token is prepared (by extractin the token from the cookies, for example)
  .preparingToken()
  // post-execution: validate token
  .check("req.token", validator)
  // centralized error handling
  .else((ctx, err) => {
    console.error("❌ Error caught:", err);
    // Optionally send JSON response
    Res.json(ctx.res, 401, { error: err.message });
  });

// Run the handler with HTTP context
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
* `setting/setAttr(attr, value, error?)` – Set attribute.
* `checking/checktAttr(attr, value, error?)` – Check attribute.

### 📡 HttpHandler

* Extends `Handler`.
* `preparing/prepareBody()`, `preparing/prepareQuery()`, `preparing/prepareCookies()`, `preparing/prepareToken()`
* Errors are **thrown** and can be caught with `.else()` for selective recovery.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!
Please open issues or pull requests on the [GitHub repository](https://github.com/fizzwiz/awaitility).

---

## 📝 License

MIT © 2025 Fizzwiz
