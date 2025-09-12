/**
 * Utility methods for handling raw http response objects
 */
export class Res {

  /**
   * Sends a JSON response with optional event emission.
   * @param {Object} res - HTTP response object
   * @param {number} code - HTTP status code
   * @param {Object} obj - JSON object to send
   * @param {EventEmitter} [emitter] - optional event emitter
   * @param {string} [event='response'] - event name
   */
  static json(res, code, obj, emitter, event = 'response') {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));

    if (emitter?.emit) {
      emitter.emit(event, { res, code, body: obj });
    }
  }

  /**
   * Sends a 302 redirect to the specified URL if the response isn't already sent.
   * @param {Object} res - HTTP response object
   * @param {string} url - redirect URL
   */
  static redirect(res, url) {
    if (!res.headersSent && !res.writableEnded) {
      res.statusCode = 302;
      res.setHeader('Location', url);
      res.end();
    }
  }

  /**
   * Ends the response with a status code and optional message.
   * @param {Object} res - HTTP response object
   * @param {number} statusCode - HTTP status code
   * @param {string} [message] - optional response body
   */
  static end(res, statusCode, message) {
    res.statusCode = statusCode;
    return res.end(message);
  }
}
