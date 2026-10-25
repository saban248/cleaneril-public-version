
// MANAGER DASHBOARD 

function MDSetTtitle(m, c){
    const titleManager = document.getElementById("managerNameTitle");
    titleManager.textContent = c.owner_fullname;
}
function MDSetLogoCompany(m, c){
    const logo = document.getElementById("companyLogo")
    const logo_path = `/static/images/logo/${c.logo_path}`
    logo.style.backgroundImage = `url('${logo_path}')`;
    logo.style.backgroundSize = "cover";
    logo.style.backgroundPosition = "center";
    logo.style.backgroundRepeat = "no-repeat";
}

function MDSetManagerAccountApproved(m, c){
    const mdManagerApprove = document.getElementById("mdManagerApprov");
    MDGeneralApproved(mdManagerApprove, m?.account_approved)
}
function MDSetCompanyApproved(m, c){
    const mdCompApprov = document.getElementById("mdCompApprov");
    MDGeneralApproved(mdCompApprov, c?.company_approved)
}
function MDGeneralApproved(element, condition){

    if (condition){
        icon = 'fa-solid fa-house-circle-check'
        text = 'מאומת'
        element.classList.add("mdci")
        element.classList.remove("mdcni")
    }
    else{
        icon = 'fa-solid fa-house-circle-xmark'
        text = 'לא מאומת'
        element.classList.add("mdcni")
        element.classList.remove("mdci")
        
    }
    const eicon = document.createElement('i')
    const span = document.createElement("span")
    span.textContent = text
    eicon.className = icon;
    element.appendChild(eicon)
    element.appendChild(span)
    

}
function MDSetSummaryWorkersInfo(m, c){
    const data = {action:SubscriptionApi.manager_workers, manager_id:m.manager_id}
    const summaryCountWorkers = document.getElementById("summaryCountWorkers");
    apiPost(ApiRoute.subs, data).then(
        (res) =>{
            if (!res.success){
                return
            }
            summaryCountWorkers.textContent = res.workers?res.workers.length:0
        }
    )
    const companyProfitSharing = document.getElementById("companyProfitSharing");
    const compkanyActiveEmployees = document.getElementById("compkanyActiveEmployees");
    companyProfitSharing.textContent = `${c.gpse}%`
    compkanyActiveEmployees.textContent = '-'

}
function MDSetViewSummary(m, c){
    const fullname = document.getElementById("managerName");
    const managerPhone = document.getElementById("managerPhone");
    const managerUserName = document.getElementById("managerUserName");
    const companyName = document.getElementById("companyName");
    const companyVAT = document.getElementById("companyVAT");
    const companyPhone = document.getElementById("companyPhone")
    const companyEmail = document.getElementById("companyEmail");
    const lastManagerActivity = document.getElementById("lastManagerActivity")
    const closeClientToday = document.getElementById("closeClientToday")
    const incomeMoneyToady = document.getElementById("incomeMoneyToady");
    const doApprovCompany = document.getElementById("doApprovCompany")
    const doApprovManager = document.getElementById("doApprovManager");
    fullname.textContent = c.owner_fullname;
    managerPhone.textContent = m.phone;
    managerUserName.textContent = m.username;
    companyName.textContent = c.company_name;
    companyVAT.textContent = Boolean(c.vat_company)?"מורשה":"פטור"
    companyPhone.textContent = c.company_phone;
    companyEmail.textContent = c.company_email;
    lastManagerActivity.textContent = getLastTimeManagerAliveHourAndYMD(m.time_alive);
    closeClientToday.textContent = 0
    incomeMoneyToady.textContent = 0
    doApprovManager.classList.toggle("show", !m.account_approved)
    doApprovCompany.classList.toggle("show", !c.company_approved)

    MDSetCompanyApproved(m, c)
    MDSetManagerAccountApproved(m, c)
    MDSetSummaryWorkersInfo(m, c)

}


function onLoadManagerDashboard(){
    const manager = getManagerById(c_runtime.currentManagerIdView);
    const company = getCompanyByManagerId(c_runtime.currentManagerIdView);
    if (!company)return
    MDSetTtitle(manager, company)
    MDSetLogoCompany(manager, company)
    MDSetViewSummary(manager, company)
    switchManagerTab(MDTabsView.SUMMARY)
}



async function doApprovAssets(asset, dany){
    const ask = showAsk({msg:"האם אתה בטוח שאתה רוצה לאשר את הנכסים של המנהל הזה?"})
    const resAsk = await ask;
    if (!resAsk){
        return null
    }
    const data = {action:SubscriptionApi.approve_assets, manager_id:c_runtime.currentManagerIdView, asset:asset, ...dany}
    const res = await apiPost(ApiRoute.subs, data);
    const toast = showToast(res?.notice)
    if (!res || !res.success){
        showToast(res?.notice, ToastStat.ERROR, toast)
        return null
    }
    showToast(res.notice, ToastStat.DONE, toast);
    setTimeout(()=>{
        reloadManagerDashboard()
    }, 1000)

}

function switchManagerTab(viewId) {
    document.querySelectorAll('.md-view').forEach(view => {
        view.classList.toggle('show', view.dataset.view == viewId);
        
    });

    document.querySelectorAll('.md-tab-item').forEach(tab => {
        tab.classList.toggle('md-tab-selected', parseInt(tab.dataset.tab) === viewId);
    });
}




