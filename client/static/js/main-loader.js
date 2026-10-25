async function fetchMyCompany() {
    const data = {action:ApiCall.my_company}
    return new Promise((resolve)=>{
        apiPost(ApiRoute.api, data).then(
            (res) =>{
                if (!res.success){
                    showToast(res.notice, ToastStat.ERROR);
                }
                else{
                    c_runtime.company = res.company;
                }
                resolve(res);
            }
        )
    })
}

async function fetchMySubscription(){
    const data = {action:ApiCall.my_subscription}
    return new Promise((resolve)=>{
        apiPost(ApiRoute.api, data).then(
            (res) =>{
                if (!res.success){
                    showToast(res.notice || 'שגיאה בטעינת המנוי', ToastStat.ERROR);
                }
                else{
                    c_runtime.subscription = res.sub;
                }
                resolve(res);
            }
        )

    }); 

}

async function fetchMyManager() {
    const data = {action:ApiCall.my_manager}
    return new Promise((resolve)=>{
        apiPost(ApiRoute.api, data).then(
            (res) =>{
                if (!res.success){
                    showToast(res.notice, ToastStat.ERROR);
                }
                else{
                    c_runtime.manager = res.manager;   
                }
                resolve(res);
            }
        )
    }); 
}


async function fetchClientOrder(orderID) {
    const order = ClientStore.getOrder(orderID)
    if (order)return order
    const data = {action:OrdersApiCall.cleanOrderDetails, oi:orderID}
    const res =  await apiPost(ApiRoute.orders, data);
    return res?.order

}

async function fetchAppProducts() {
    const data = {action:ApiCall}//null
    c_runtime.products = CleanerILProducts
}

async function MainLoaderAppAPIData(){
    const emit = (step)=>EventRegistry.emit(AppEvent.MAIN_APP_LOAD, step)
    await fetchOrders();
    emit(1)
    await fetchInvoice();
    emit(2)
    await fetchClients();
    emit(3)
    await fetchWorkers();
    emit(4)
    await fetchPermissions();
    emit(5)
    await fetchManagers();
    emit(6)
    await fetchCompanies();
    emit(7)
    await fetchSubscriptions();
    emit(8)
    await fetchMySubscription();
    emit(9)
    await fetchMyJobs();
    emit(10)
    await fetchAvailablJobs()
    emit(11)
    await fetchAppProducts()
    emit(12)
    await fetchOrdersDeleted()
    emit(13)
    await renderSubscriptionTable();
    emit(14)
    renderListOrdersAll()
    emit(15)
    renderListOrdersSTM()  
    emit(16)
}

function showloadingProgress(){
    const STEPS = 16
    const callback = (step) =>{
        showToast(`${(step*100/STEPS).toFixed(2)}%`, step!=STEPS?ToastStat.LOAD:ToastStat.DONE,toast, false)
        if (step == STEPS){
            closeEvent();
            setTimeout(()=>closeToast(toast), 2000)
        }
    }
    const toast = showToast('מכין..', ToastStat.LOAD, null, false)
    const closeEvent = EventRegistry.on(AppEvent.MAIN_APP_LOAD, callback)


    
}

document.addEventListener("DOMContentLoaded", async function (){
    showloadingProgress()
    await MainLoaderAppAPIData()
    if (location.pathname != PageRoute.auth || location.pathname != PageRoute.createAccount || !location.pathname != ''){
        doAlive()
    }
    
})
