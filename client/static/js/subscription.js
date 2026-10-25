const c_sub = {
    filterMenuOn:[],
    s:0,
    t:0,
    o:1,
    a:0
} 


function buildFilterOptions(containerId, items, onSelect, show = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    for (const item of items) {
        const option = document.createElement("div");
        option.className = "filter-option";
        option.dataset.s = item.value;

        option.innerHTML = `
            <i class="${item.icon}"></i>
            <span>${item.text}</span>
        `;

        option.addEventListener("click", () => {
            onSelect(item.value)
            switchFilterOptions(containerId)
        });

        container.appendChild(option);
    }
    switchFilterOptions(containerId, show)
}

function switchFilterOptions(_id, show = false){
    const off = document.getElementById(_id).classList.contains("show")
    for (cls of c_sub.filterMenuOn){
        const menu = document.getElementById(cls)
        if (!menu){
            c_sub.filterMenuOn = c_sub.filterMenuOn.filter(m=>m!=cls)
            break
        }
        document.getElementById(cls).classList.remove("show")
    }
    if (off && !show){
        
        return
    }
    
    toggleFilterOptions(_id)
}


function toggleFilterOptions(_id) {
    const fss = document.getElementById(_id);
    fss.classList.toggle('show');

    if (!c_sub.filterMenuOn.includes(_id)){
        c_sub.filterMenuOn.push(_id)
    }
}

function closeFilterOptions() {
    for (const id of c_sub.filterMenuOn) {
        const option = document.getElementById(id);
        if (option) {
            option.classList.remove('show');
        }
    }
}

function selectSubscriptionState(_id, t) {
    const vss = document.getElementById('viewSubscriptionStat');
    const stat = parseInt(t.dataset.s);
    const statText = getSubscriptionStatText(stat);
    vss.textContent = statText
    toggleFilterOptions(_id)
    if (c_sub.s == stat){
        return
    }
    c_sub.s = stat
    // 
    renderSubscriptionTable()
}


function selectSubscriptionType(_id, t){
    const vst = document.getElementById('viewSubscriptionType');
    const stat = parseInt(t.dataset.s);
    const statText = getSubscriptionTypeText(stat);
    vst.textContent = statText
    c_sub.t = stat
    toggleFilterOptions(_id)
}


function selectSubscriptionOrder(_id, t){
    const vso = document.getElementById('viewSubscriptionOrder');
    const stat = parseInt(t.dataset.s);
    c_sub.o = stat;
    const statText = getSubscriptionOrderText(stat);
    vso.textContent = statText
    toggleFilterOptions(_id)
    // run
    renderSubscriptionTable();
}


function selectSubscriptionAccountState(_id, t){
    const vsa = document.getElementById('viewSubscriptionAccount');
    const stat = parseInt(t.dataset.s);
    let statText = 'הכל';
    if (stat !== 0){
        const res = getManagerAccountStatIconText(stat);
        statText = Array.isArray(res) ? res[0] : res;
    }
    vsa.textContent = statText;
    c_sub.a = stat;
    toggleFilterOptions(_id);
    renderSubscriptionTable();
}


function closeSearchManager(t){
    closeSearchInput('searchManager', t)
    doSearchManagersLocal()
}



function createSubscriptionTableCell(text){
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

function createSubscriptionPermissionCell(permission, text, icon){
    const cell = document.createElement("td");
    const badge = document.createElement("span");
    const iconEl = document.createElement("i");
    const textEl = document.createElement("span");

    badge.className = `subscription-permission permission-${permission != -1 ? permission: ManagerPermissions.VIEW}`;
    iconEl.className = icon;
    textEl.textContent = text;

    badge.append(iconEl, textEl);
    cell.appendChild(badge);
    return cell;
}

function createSubscriptionAccountStatCell(account_plan, text, icon){
    const cell = document.createElement("td");
    const badge = document.createElement("span");
    const iconEl = document.createElement("i");
    const textEl = document.createElement("span");
    
    iconEl.className = icon;
    textEl.textContent = text;
    
    let planClass = 'plan-default';
    if (account_plan == UserAccountSubscription.FREE) {
            planClass = 'plan-free';
    } else if (account_plan == UserAccountSubscription.PREMIUM ) {
        planClass = 'plan-premium';
    }

    
    
    badge.className = `subscription-account-stat ${planClass}`;
    badge.append(iconEl, textEl);
    cell.appendChild(badge);
    return cell;
}

function getLastTimeManagerAliveHourAndYMD(timeAlive){
    if (!timeAlive)return "לא ידוע";
    if (timeAlive > 1e12)timeAlive = timeAlive / 1000;

    const date = new Date(timeAlive * 1000);
    const today = new Date();
    const isToday = date.toLocaleDateString('he-IL') == today.toLocaleDateString('he-IL');
    if (isToday)return `${dateFloatToHour(timeAlive)} היום`;

    const dayName = date.toLocaleDateString('he-IL', { weekday: 'long' });
    const monthYear = date.toLocaleDateString('he-IL', {
        month: '2-digit',
        year: 'numeric'
    }).replace("/", ".");

    return `${dayName} ${dateFloatToHour(timeAlive)} ${monthYear}`;
}

async function fetchManagerDashboard(manager_id) {
    const template = document.getElementById('managerTemplate');
    const toastId = showToast('טוען..', ToastStat.LOAD);
    try {
        const data = { action: SubscriptionApi.manager_dashboard, manager_id: manager_id };
        const res = await apiPost(ApiRoute.subs, data);

        if (!res || !res.success) {
            const errMsg = res?.notice
            showToast(errMsg, ToastStat.ERROR, toastId);
        }

        template.innerHTML = res.template || '';
        c_runtime.currentManagerIdView = manager_id;        
        template.classList.add('show');
        onLoadManagerDashboard()
    } catch (err) {
        showToast(err.message, ToastStat.ERROR, toastId);
        throw err;
    }
    closeToast(toastId);
}


function showManagerDashboard(){
    const template = document.getElementById('managerTemplate');
    template.classList.add("show")
}
function hideManagerDashboard(){
    const template = document.getElementById('managerTemplate');
    template.classList.remove("show")
}
function closeManagerDashboard(){
    hideManagerDashboard()
}
async function reloadManagerDashboard(){
    await fetchManagers();
    await fetchCompanies();
    closeManagerDashboard()
    openManagerDashboard(c_runtime.currentManagerIdView)

}

async function openManagerDashboard(managerId) {
    try {
        await fetchManagerDashboard(managerId);
        showManagerDashboard()
    } catch (error) {
        showToast(error.message, ToastStat.ERROR);
    }
}

const menuItemsSubscription = [
    { text: "ניהול", action: (managerId) => openManagerDashboard(managerId), icon:'<i class="fa-solid fa-eye"></i>'},
    { text: "הפעל", action: (managerId) => setManagerAccountStat(managerId, SubscriptionApi.m_active), icon:'<i class="fa-solid fa-play"></i>'},
    { text: "השהה", action: (managerId) => setManagerAccountStat(managerId, SubscriptionApi.m_pause), icon:'<i class="fa-solid fa-circle-pause"></i>'},
    { text: "חסום", action: (managerId) => setManagerAccountStat(managerId, SubscriptionApi.m_banned), icon:'<i class="fa-solid fa-ban"></i>'},
    { text: "להמתנה", action: (managerId) => setManagerAccountStat(managerId, SubscriptionApi.m_pending), icon:'<i class="fa-solid fa-hourglass-start"></i>'},
    { text: "מחיקה לצמיתות", action: (managerId) => deleteManagerAccount(managerId), icon:'<i class="fa-solid fa-trash-can trash"></i>'},
]

function openMenuSubscription(e, managerId){
    e.stopPropagation();

    const menu = document.getElementById("subscriptionMenu");
    if (!menu)return;

    if (menu.classList.contains("show") && menu.dataset.managerId == managerId){
        menu.classList.remove("show");
        return;
    }

    menu.dataset.managerId = managerId;
    menu.innerHTML = "";

    menuItemsSubscription.forEach(item => {
        const cma = document.createElement("div");
        cma.className = "cma";

        const cma1 = document.createElement("div");
        cma1.className = "cma1";
        cma1.innerHTML = item.icon;

        const cma2 = document.createElement("div");
        cma2.className = "cma2";
        cma2.textContent = item.text;

        cma.append(cma1, cma2);
        cma.onclick = (event) => {
            event.stopPropagation();
            item.action(managerId);
            menu.classList.remove("show");
        }

        menu.appendChild(cma);
    });

    menu.style.visibility = "hidden";
    menu.style.top = "0px";
    menu.style.left = "0px";
    menu.classList.add("show");

    const margin = 8;
    const gap = 6;
    const rect = menu.getBoundingClientRect();
    const openAbove = e.clientY + rect.height + gap > window.innerHeight - margin;
    let top = openAbove ? e.clientY - rect.height - gap : e.clientY + gap;
    let left = e.clientX - rect.width;

    if (left < margin)left = e.clientX;
    if (left + rect.width > window.innerWidth - margin)left = window.innerWidth - rect.width - margin;
    if (top < margin)top = margin;
    if (top + rect.height > window.innerHeight - margin)top = window.innerHeight - rect.height - margin;

    menu.style.transformOrigin = openAbove ? "bottom right" : "top right";
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.visibility = "";
}

function createSubscriptionTableItem(manager, company, sub){
    const row = document.createElement("tr");
    const managerId = manager.manager_id;
    const permission = manager.permission;
    const time_alive = (Date.now() - manager.time_alive * 1000) / 1000
    const register_done = company.register_level == RegisterApi.DONE
    const verified = false
    const phone = manager.phone
    const vat = company?.company_VAT || company?.vat || "";
    const [p_text, p_icon] = getManagerPermissionIconText(permission)
    const [as_text, as_icon] = getManagerAccountStatIconText(manager.account_stat)
    const [s_text, s_icon] = getUserAccountSubscriptionIconText(sub?.subscription_plan)

    row.id = managerId;
    row.className = "subscription-table-item";
    row.onclick = (e) => openMenuSubscription(e, managerId);

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = `subscription-status ${time_alive < 120 ? "connected" : "disconnected"}`;
    status.textContent = time_alive < 120 ? "מחובר" : getLastTimeManagerAliveHourAndYMD(manager.time_alive) 
    statusCell.appendChild(status);

    row.append(
        statusCell,
        createSubscriptionTableCell(company.owner_fullname),    
        createSubscriptionTableCell(company.company_name),
        createSubscriptionPermissionCell(permission, p_text, p_icon),
        createSubscriptionTableCell(verified ? "כן":"לא"),
        createSubscriptionTableCell(register_done ? "לא הושלם": "הושלם"),
        createSubscriptionTableCell(as_text),
        createSubscriptionAccountStatCell(sub?.subscription_plan, s_text, s_icon),

    );

    return row;
}

function renderSubscriptionTable(){
    const tableBody = document.getElementById("subscriptionsTableBody");
    if (!tableBody) return;
    tableBody.replaceChildren();
    tableBody.innerHTML = "";

    if (!c_runtime.managers.length){
        const emptyRow = document.createElement("tr");
        emptyRow.className = "subscriptions-empty-row";
        emptyRow.innerHTML = `<td colspan="8">אין מנויים להצגה</td>`;
        tableBody.appendChild(emptyRow);
        return;
    }
    var copy = [...c_runtime.managers]
    if (c_sub.o & 1){
        copy = copy.sort((a, b) => b.time_register - a.time_register);
    }
    else if (c_sub.o & 2){
        copy = copy.sort((a, b) => a.time_register - b.time_register)
    }

    for (const manager of copy){
        const company = getCompanyByManagerId(manager.manager_id)
        const sub = getSubscriptionByManagerId(manager.manager_id)
        if (!company)continue;
        // account status filter
        if (c_sub.a && c_sub.a !== 0){
            if (!(manager.account_stat & c_sub.a)) continue;
        }
        tableBody.appendChild(createSubscriptionTableItem(manager, company, sub));
    }
}


function doSearchManagersLocal(){
    const input = document.getElementById("searchManager")
    const value = input.value.toLowerCase();
    const managers = Array.isArray(c_runtime.managers) ? c_runtime.managers : [];
    for (const manager of managers){
        const company = getCompanyByManagerId(manager.manager_id);
        const manager_id = manager.manager_id;
        const row = document.getElementById(manager_id);
        const phone = manager.phone ? String(manager.phone).toLowerCase().includes(value) : false;
        const ID = company && company.company_VAT ? String(company.company_VAT).toLowerCase().includes(value) : false;
        const company_name = company && company.company_name ? String(company.company_name).toLowerCase().includes(value) : false;

        if (value === '' || phone || ID || company_name) {
            row?.classList.remove("hide");
        } else {
            row?.classList.add("hide");
        }
    }
}


async function setManagerAccountStat(manager_id, stat){
    const data = {action:stat, manager_id:manager_id}
    const toast = showToast("מגדיר...");
    apiPost(ApiRoute.subs, data).then(
        async (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
                return
            }
            await fetchManagers()
            await fetchCompanies()
            renderSubscriptionTable();
            showToast(res.notice, ToastStat.DONE, toast);
        }
    )
}


async function deleteManagerAccount(mid){
    const ok = await showAsk({msg:message.WDeleteManagerAccount})
    if (!ok){return false}
    const data = {action:SubscriptionApi.m_delete, manager_id:mid}
    const toast = showToast("מוחק")

    apiPost(ApiRoute.subs, data).then(
        async (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
                return
            }
            await fetchManagers()
            await fetchCompanies()
            renderSubscriptionTable()
            showToast(res.notice, ToastStat.DONE, toast);

        }
    )
}

document.addEventListener("click", e => {
    const menu = document.getElementById("subscriptionMenu");
    if (menu && !menu.contains(e.target)){
        menu.classList.remove("show");
    }

    const clickedInsideFilters = Boolean(e.target.closest('.filter-item, .filter-options, .viewFilterSelected'));
    if (!clickedInsideFilters) {
        closeFilterOptions();
    }
})


