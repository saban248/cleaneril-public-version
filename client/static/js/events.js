const AppEvent = Object.freeze({
    // Clients
    CLIENT_CREATED: 1n << 0n,  // 1n
    CLIENT_UPDATED: 1n << 1n,  // 2n
    CLIENT_DELETED: 1n << 2n,  // 4n

    // Orders
    ORDER_CREATED: 1n << 3n,   // 8n
    ORDER_UPDATED: 1n << 4n,   // 16n
    ORDER_DUPLICATE:1n<<19n,
    ORDER_DELETED: 1n << 5n,   // 32n


    // Invoices
    INVOICE_CREATED: 1n << 6n, // 64n
    INVOICE_UPDATED: 1n << 7n, // 128n
    INVOICE_DELETED: 1n << 8n, // 256n

    // Workers
    WORKER_CREATED: 1n << 9n,  // 512n
    WORKER_UPDATED: 1n << 10n, // 1024n
    WORKER_DELETED: 1n << 11n, // 2048n

    // Products
    PRODUCT_CREATED: 1n << 12n, // 4096n
    PRODUCT_UPDATED: 1n << 13n, // 8192n
    PRODUCT_DELETED: 1n << 14n, // 16384n

    // marketplace
    ORDER_STM: 1n << 17n,

    // UI
    UI_REFRESH: 1n << 15n,      // 32768n
    UI_STATE_CHANGED: 1n << 16n, // 65536n
    // main loader
    MAIN_APP_LOAD:1n << 18n


});

const EventRegistry = (() => {

    const listeners = new Map();

    function on(event, callback) {
        if (typeof callback !== "function")
            return () => {};

        let eventListeners = listeners.get(event);

        if (!eventListeners) {
            eventListeners = new Set();
            listeners.set(event, eventListeners);
        }

        eventListeners.add(callback);

        return () => off(event, callback);
    }


    function off(event, callback) {
        const eventListeners = listeners.get(event);

        if (!eventListeners)
            return false;

        const removed = eventListeners.delete(callback);

        if (eventListeners.size === 0) {
            listeners.delete(event);
        }

        return removed;
    }


    function emit(event, data = undefined) {
        const eventListeners = listeners.get(event);

        if (!eventListeners)
            return;

        for (const callback of [...eventListeners]) {
            try {
                callback(data);
            } catch (error) {
                console.error(
                    `Event listener failed for event ${event}`,
                    error
                );
            }
        }
    }


    function once(event, callback) {
        if (typeof callback !== "function")
            return () => {};

        const unsubscribe = on(event, data => {
            unsubscribe();
            callback(data);
        });

        return unsubscribe;
    }


    function clear(event) {
        if (event === undefined) {
            listeners.clear();
            return;
        }

        listeners.delete(event);
    }


    function hasListeners(event) {
        return listeners.has(event);
    }


    return Object.freeze({
        on,
        off,
        emit,
        once,
        clear,
        hasListeners
    });

})();
