



async function fetchAvailablJobs() {
    const data = {action:MarketplaceApiCall.listJobs}
    const res = await apiPost(ApiRoute.marketplace, data)
    if (!res||!res.success){
        return
    }
    c_market.availableJob = res.jobs;
}

async function fetchMyJobs() {
    const data = {action:MarketplaceApiCall.listMyJobs}
    const res = await apiPost(ApiRoute.marketplace, data)
    if (!res||!res.success){
        return
    }
    c_runtime.myJobs = res.jobs;  
}
async function fetchTransactions() {
    const data = {action:MarketplaceApiCall.listTransactions}
    const res = await apiPost(ApiRoute.marketplace, data)
    if (!res||!res.success){
        return
    }
    c_market.transactions = res.transactions;
}


async function callViewJob() {
    if (!c_market.currentJobIdView)return

    const data = {action:MarketplaceApiCall.viewJob, jid:c_market.currentJobIdView}
    const res = await apiPost(ApiRoute.marketplace, data)
    if (!res||!res.success){
        return
    }
    
}

async function doJobRequest(callBefore = ()=>{}, callAfter = ()=>{}, callSuccess = ()=>{}, error=()=>{}) {
    if (!c_market.currentJobIdView){
        showToast(message.EneedRefresh, ToastStat.ERROR)
        callAfter()
        return;
    }
    callBefore()
    const data = {action:MarketplaceApiCall.JobRequest, jid:c_market.currentJobIdView}
    const res = await apiPost(ApiRoute.marketplace, data)
    if (!res || !res.success){
        callAfter()
        error(res)
        return
    }
    callAfter()
    callSuccess()

}