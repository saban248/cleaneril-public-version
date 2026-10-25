const ClientStore = (() => {
    let clientsById = new Map();
    let ordersById = new Map();
    const subscribers = new Set();

    function indexById(items, idField){
        const index = new Map();
        if (!Array.isArray(items))return index;

        for (const item of items){
            if (item && item[idField] != null){
                index.set(String(item[idField]), item);
            }
        }
        return index;
    }

    function notify(change){
        for (const subscriber of subscribers){
            try {
                subscriber(change);
            } catch (error) {
                console.error("ClientStore subscriber failed", error);
            }
        }
    }

    function patchEntity(index, id, idField, entityType, patch){
        const entity = index.get(id);
        if (!entity || !patch || typeof patch !== "object")return null;

        const changedFields = [];
        for (const [field, value] of Object.entries(patch)){
            if (Object.is(entity[field], value))continue;
            entity[field] = value;
            changedFields.push(field);
        }

        if (changedFields.length){
            notify({
                entityType,
                id:entity[idField],
                entity,
                changedFields
            });
        }

        return {entity, changedFields};
    }

    return Object.freeze({
        setClients(clients){
            c_runtime.clients = [
                ...new Map([
                    ...c_runtime.clients,
                    ...clients
                ].map(client => [
                    client.client_id,
                    client
                ])).values()
            ];
            clientsById = indexById(c_runtime.clients, "client_id");
            return c_runtime.clients;
        },

        setOrders(orders){
            c_runtime.orders = [
                ...new Map([...c_runtime.orders, ...orders].map(o => [o.order_id, o])).values()
            ];
            ordersById = indexById(c_runtime.orders, "order_id");
            return c_runtime.orders;
        },

        getClient(clientId){
            return clientsById.get(clientId);
        },

        getOrder(orderId){
            return ordersById.get(orderId);
        },

        patchClient(clientId, patch){
            return patchEntity(clientsById, clientId, "client_id", "client", patch);
        },

        patchOrder(orderId, patch){
            return patchEntity(ordersById, orderId||c_runtime.currentOrderIdView, "order_id", "order", patch);
        },

        subscribe(subscriber){
            if (typeof subscriber !== "function")return () => {};
            subscribers.add(subscriber);
            return () => subscribers.delete(subscriber);
        }
    });
})();
