const ClientApi = Object.freeze({
    listClients(){
        return apiPost(ApiRoute.api, {action:ApiCall.list_clients});
    },

    listOrders(fromY){
        return apiPost(ApiRoute.orders, {action:OrdersApiCall.listCleanOrders, fromY});
    },

    listDeletedOrders(data){
        return apiPost(ApiRoute.orders, data);
    },

    saveOrder(data){
        return apiPost(ApiRoute.orders, data);
    },

    updateOrderState(data){
        return apiPost(ApiRoute.api, data);
    }
});
