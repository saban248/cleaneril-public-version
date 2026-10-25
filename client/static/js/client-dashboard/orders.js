

function setCurrentOrderIdAsNext(){
    cid = c_runtime.currentClientIdView;
    if (!cid||!c_runtime.orders.length)return null

    const orders = c_runtime.orders.filter(o=>o.client_id == cid)
    if (!orders.length)return
    c_runtime.currentOrderIdView = orders[0].order_id
}

function get_order_by_order_id(oid){
    return ClientStore.getOrder(oid)
}

function get_total_price_by_order_id(order_id){
    const order = get_order_by_order_id(order_id)
    if (!order){
        return 0
    }

    let total = 0;
    for (const [k, item] of Object.entries(order.items)){
        total += parseInt(item.price);
    }
    return total-order.off_price
}

async function initDuplicateCleanOrder(){
    const ask = await showAsk({title:"שיכפול הזמנה קיימת", msg:"ליצור העתק של ההזמנה הנוכחית?"})
    if (!ask)return
    await duplicateCleanOrder(c_runtime.currentClientIdView, c_runtime.currentOrderIdView)
}


async function duplicateCleanOrder(clientId, orderId){
    if (!clientId){clientId = c_runtime.currentClientIdView;}
    if (!orderId){orderId = c_runtime.currentOrderIdView;}

    const data = {action:OrdersApiCall.duplicateCleanOrder, client_id:clientId, oi:orderId}
    const toast = showToast("משכפל הזמנה..");
    return await apiPost(ApiRoute.orders, data).then(
        async (res) => {
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
                return
            }
            else{
                // running..
            }
            c_c_dashboard.editor =true;
            await fetchOrders()
            await initClientOrder(res.order_id);
            showToast(res.notice,ToastStat.DONE, toast)
        }
    )
}

function createLinkClientOrder(){
    const order = ClientStore.getOrder(c_runtime.currentOrderIdView);
    if (!order){return 1}
    const link = `${CONFIG.URL}/${PageRoute.public}?p=1&oi=${order.order_id}&koi=${order.key}`
    mainShareData.text += `\n\n${link}`;
    mainShareData.files = []
    
    return 0
}

async function deleteOrder(order_id = c_runtime.currentOrderIdView, callback, noNull = false){
    const ok = await showAsk({msg:message.WdeleteOrder})
    if (!ok){return false}
    if (!order_id){
        return true
    }
    data = {oi:order_id, action:OrdersApiCall.deleteCleanOrder}
    return await new Promise((reslove) => apiPost(ApiRoute.orders,data).then(
        async (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.DONE);
                return false
            }
            EventRegistry.emit(AppEvent.ORDER_DELETED, res)
            reslove(true)
        }
    ))
}


async function deleteOrderFromDashhbaord(order_id = c_runtime.currentOrderIdView) {
    await deleteOrder(order_id)
}


function getOrdersByClientId(clientId){
    if (!clientId){return []}
    return c_runtime.orders.filter(order => order.client_id == clientId)
}


async function abortOrderEdit(){
    c_c_dashboard.editor = false;
    c_c_dashboard.newOrder = false;
    await initClientOrder(c_runtime.currentOrderIdView)
    switchMenuActionClientCard()
}

async function restoreOrder(orderId){
    const data = {action:OrdersApiCall.restoreCleanOrder, oi:orderId}
    await apiPost(ApiRoute.orders, data).then(
        async (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR);
                return
            }
            await reloadOnPageClients()
            showToast(res.notice, ToastStat.DONE);
        }
    )
}

async function validateBeforeShareToMarketplace(orderID) {
    const data = {action:MarketplaceApiCall.validateShareOrderMarketplace, oi:orderID}
    const toast = showToast("מאמת..");
    const res = await apiPost(ApiRoute.marketplace, data);
    if (!res || !res.success){
        showToast(res?.notice||"", ToastStat.ERROR, toast);
        return 1
    }
    closeToast(toast)

    return 0
}
async function initShareOrderToMarketplace(orderID){
    if (!orderID && c_runtime.currentOrderIdView){
        orderID = c_runtime.currentOrderIdView;
    }
    const order = ClientStore.getOrder(orderID)
    if (!order){
        showToast(message.EneedRefresh, ToastStat.ERROR)
        return
    }
    c_runtime.currentOrderIdView = order.order_id;
    c_runtime.currentClientIdView = order.client_id;
    if (!order.marketplace_shared){
        const stat = await validateBeforeShareToMarketplace(orderID)
        if (stat)return
        const askContinue = await showAsk({title:"שיתוף עבודה במרקטפלייס", msg:"להמשיך?"})
        if (!askContinue){return}
    }
    c_c_dashboard.inStm = true;
    if (!c_c_dashboard.inOrder){
        await openClientDashbaord(order.client_id, order.order_id,null,null, clientCardsView.SHARE_MARKETPLACE);
    }
    else{
        switchViewClientDashboard(clientCardsView.SHARE_MARKETPLACE)
    }
}

async function cancelShareOrderToMarketplace(orderID){
    if (!orderID){
        orderID = c_runtime.currentOrderIdView;
    }
    const askContinue = await showAsk({title:"אתה בטוח?", msg:"השהייה של השיתוף?"})
    if (!askContinue){return}
    const data = {action:MarketplaceApiCall.cancelShareOrderMarket, oi:orderID}
    const res = await apiPost(ApiRoute.marketplace, data);
    if (!res || !res.success){
        showToast(res.notice, ToastStat.ERROR);
        return;
    }
    EventRegistry.emit(AppEvent.ORDER_STM, res)
    openClientDashbaord(c_runtime.currentClientIdView, c_runtime.currentOrderIdView, true);
}


async function establishedShareOrderJob(job_id, request_id, callSuccess) {
    const error = (e)=>showToast(e||message.EneedRefresh, ToastStat.ERROR);
    if (!c_runtime.currentOrderIdView || !job_id){
        error()
        return
    }
    const job = c_runtime.myJobs.find(j => j.job_id == job_id);
    if (!job){
        error()
        return
    }
    const request = job.requests.find(r => r.request_id == request_id)
    if (!request){
        error()
        return;
    }
    const askContinue = await showAsk({title:"העברת לקוח לצד שלישי", msg:`להעביר לקוח זה ל-${request.company_name}?`})
    if (!askContinue){
            return
    } 
    const data = {action:MarketplaceApiCall.establishedShareJob,mid:request.manager_id,jid:job_id,oi:job.order_id}
    const res = await apiPost(ApiRoute.marketplace, data)
    if (!res||!res.success){
        error(res.notice);
        return
    }
    if (callSuccess){
        callSuccess(job_id, request_id,res)
    }
    
}

async function rejectRequestShareOrderJob(job_id, request_id, callSuccess) {
    const error = (e)=>showToast(e||message.EneedRefresh, ToastStat.ERROR);
    if (!c_runtime.currentOrderIdView || !job_id){
        error()
        return
    }
    const job = c_runtime.myJobs.find(j => j.job_id == job_id);
    if (!job){
        error()
        return
    }
    const request = job.requests.find(r => r.request_id == request_id)
    if (!request){
        error()
        return;
    }
    const askContinue = await showAsk({title:"העברת לקוח לצד שלישי", msg:`לדחות בקשה זו?`})
    if (!askContinue){
            return
    } 
    const data = {action:MarketplaceApiCall.rejectShareJob,mid:request.manager_id,jid:job_id,oi:job.order_id}
    const res = await apiPost(ApiRoute.marketplace, data)
    if (!res||!res.success){
        error(res.notice);
        return
    }
    if (callSuccess){
        callSuccess(job_id,request_id,res)
    }
}

async function deleteRequestShareOrderJob(job_id, request_id, onSuccess) {
    const askContinue = await showAsk({title:"העברת לקוח לצד שלישי", msg:`למחוק בקשה זו?`})
    if (!askContinue){
            return
    } 
    const data = {action:MarketplaceApiCall.deleteRequestShareJob, rid:request_id}
    const res = await apiPost(ApiRoute.marketplace, data)
    if (!res||!res.success){
        showToast(res.notice, ToastStat.ERROR);
        return;
    }
    if (onSuccess){
        await onSuccess(job_id, request_id, res)
    }
}
async function onSuccessJobStates(jid,rid, res){
    await reloadOnPageClients(clientsView.STM)
    removeListRequestsToJob()
    const parent = document.getElementById("stm-parts-ui")
    const job = c_runtime.myJobs.find(j => j.job_id == jid)
    console.log(job)
    if (!job)return
    parent.insertAdjacentHTML("beforeend", renderListRequestsToJob(job.order_id))
}


async function initEstablishedShareJob(job_id, request_id){
    await establishedShareOrderJob(job_id, request_id, onSuccessJobStates)
}
async function initRejectShareJob(job_id, request_id) {
    await rejectRequestShareOrderJob(job_id, request_id, onSuccessJobStates)
}
async function initDeleteRequestShareJob(job_id, request_id) {
    await deleteRequestShareOrderJob(job_id,request_id, onSuccessJobStates)
}




function onOrderSTM(res){
    const order = ClientStore.getOrder(c_runtime.currentOrderIdView)
     ClientStore.patchOrder(null, {
        marketplace_shared: !order.marketplace_shared
    });
    
    
}