/**
 * A serializable base class for notifications, such as Errors, Messages, and Events.
 *
 * Can be used locally or across distributed systems.
 * In inter-machine communication, a Notification is never treated as a valid result:
 * it can either be emitted as an event or transformed into an error.
 */
export class Notification {
    /**
     * Human-readable description of the notification.
     * @type {string}
     */
    msg;

    /**
     * Arbitrary data associated with the notification.
     * @type {any}
     */
    payload;

    /**
     * Optional originator of the notification.
     * Typically used for local notifications.
     * @type {object|undefined}
     */
    emitter;

    /**
     * The cause of this notification (e.g. an event, error, or another notification).
     * @type {object|undefined}
     */
    source;

    /**
     * Create a new Notification instance.
     * @param {string} msg - Human-readable message.
     * @param {any} [payload={}] - Optional additional data.
     * @param {object} [emitter] - Optional origin of the notification.
     * @param {object} [source] - Optional cause of the notification.
     */
    constructor(msg, payload = {}, emitter = undefined, source = undefined) {
        this.msg = msg;
        this.payload = payload;
        this.emitter = emitter;
        this.source = source;
    }
}
