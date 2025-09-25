import { Handler } from "./core/Handler.js";
import { HandlerError } from "./core/HandlerError.js";

import { HttpHandler } from "./handler/HttpHandler.js";
import { HttpError } from "./error/HttpError.js";

import { DomHandler } from "./handler/DomHandler.js";
import { DomError } from "./error/DomError.js";

import { Async } from "./util/Async.js";
import { Path } from "./util/Path.js";
import { Req } from "./util/Req.js";
import { Res } from "./util/Res.js";

export {Handler, HandlerError, HttpHandler, HttpError, DomHandler, DomError, Async, Path, Req, Res};

/**
 * Core classes providing the base asynchronous handler framework.
 * 
 * - {@link Handler} – Base chainable, context-aware async handler.
 * - {@link HandlerError} – Base error for handler operations.
 * @module core
 */

/**
 * Specific handlers built on top of {@link Handler}.
 * 
 * - {@link HttpHandler} – Handles HTTP request/response context.
 * - {@link DomHandler} – Handles DOM context and node manipulation.
 * @module handler
 */

/**
 * Structured error classes for use with the respective handlers.
 * 
 * - {@link HttpError} – Error for HTTP handler operations.
 * - {@link DomError} – Error for DOM handler operations.
 * @module error
 */

/**
 * Utility classes of static methods for asynchronous flows and context manipulation.
 * 
 * - {@link Async} – Async helper utilities.
 * - {@link Path} – Safe object path access and manipulation.
 * - {@link Req} – HTTP request helpers.
 * - {@link Res} – HTTP response helpers.
 * @module util
 */



