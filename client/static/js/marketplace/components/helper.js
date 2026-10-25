
function getRequestsNotViewed(job_id){
    const job = c_runtime.myJobs.find(j => j.job_id == job_id)
    if (!job)return 0

    return job.requests.filter(r => !r.viewed);
}
function getCountRequestsNotViewed(job_id){
    const list = getRequestsNotViewed(job_id)
    return list?.length||0
}

function thisCleanOrderShareWithMe(order_id){
    const order = ClientStore.getOrder(order_id)
    if (!order){
        return false
    }

    return order.manager_id != c_runtime.manager.manager_id
}

 
function getClientOrdersSharedToMarket(client_id){
    const orders = c_runtime.orders.filter(o => o.client_id == client_id && o.marketplace_shared)
    return orders
}
function getCountClientOrdersSharedToMarket(client_id){
    const list = getClientOrdersSharedToMarket(client_id)
    return list?.length||0
}