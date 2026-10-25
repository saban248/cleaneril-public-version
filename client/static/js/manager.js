async function fetchPermissions(){
    const permissions = c_runtime.currentUPermission;
    if (permissions)return permissions;

    return new Promise((resolve) => {
        apiPost(ApiRoute.api, {action:ApiCall.permissions}).then(
            (res) => {
                if (!res.success){
                    showToast(res.notice, ToastStat.ERROR)
                }
                else{
                    c_runtime.currentUPermission = parseInt(res.p);
                }
                resolve(res)
            }
        )
    })
}


async function fetchManagers(){
    return new Promise((resolve) => { 
        apiPost(ApiRoute.api, {action:ApiCall.list_managers}).then(
            (res) =>{
                if (!res.success){
                }
                else{
                    c_runtime.managers = res.managers;
                }
                resolve()
            }
        )
    })
}

async function fetchCompanies(){
    return new Promise((resolve) => {
        apiPost(ApiRoute.api, {action:ApiCall.list_companies}).then(
            (res) =>{
                if (!res.success){
                }else{
                    c_runtime.companies = res.companies;
                }
                resolve()
            }
        )
    })
}

function fetchSubscriptions(){
    return new Promise((resolve) => {
        apiPost(ApiRoute.subs, {action:SubscriptionApi.list_subscriptions}).then(
            (res) =>{
                if (!res.success){
                    showToast(res.notice, ToastStat.ERROR)
                }else{
                    c_runtime.subscriptions = res.subscriptions;
                }
                resolve()
            }
        )
    })
}

function getCompanyByManagerId(manager_id){
    return c_runtime.companies.find(company => company.manager_id == manager_id)
}

function getSubscriptionByManagerId(manager_id){
    return c_runtime.subscriptions.find(sub => sub.manager_id == manager_id)
    
}

function getManagerById(manager_id){
    if (!c_runtime.managers)return
    return c_runtime.managers.find(m => m.manager_id == manager_id)
}

function getCurrentManagerId(){
    return c_runtime.manager.manager_id
}

function getCurrentManagerName(){
    return "מנהל (אתה)"
}

function uploadImage(file, name, action) {
    if (!file)return;
    uploadImageFile(file, {filename:name, action:action}, res => {
        if (!res.success)return
        if (action == ApiUploadFile.LOGO){
                const setView = document.getElementById("logoView")
                const previewUrl = URL.createObjectURL(file);
                setView.src = previewUrl;
                setView.onload = () => {
                    URL.revokeObjectURL(previewUrl);
                };
            location.reload();
        }
    });
}
