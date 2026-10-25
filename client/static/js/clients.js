const clientsView = {
    ORDERS:1<<0,
    TIMELINE:1<<1,
    TRASH:1<<2,
    STM:1<<3
}


const configClients = {
    timelineRefresh:false,
    currentView:clientsView.ORDERS,
    refreshView:false
}


const magicWordSearchOrder = [
    'הנחה', 'קבלה', 'לקוח חוזר'
]

function mainSyncTotalPrice(element){
    let currentValue = element.value;
    if (currentValue !== '' && !/^\d+$/.test(currentValue)) return;
    if (currentValue == ''){currentValue = 0}
    const clientPrice = document.getElementById("client-price")
    const clientVat = document.getElementById("client-vat")
    const __items_ordered = document.getElementById('items-ordered').children.length;
    let total = 0
    for (let i=0; i < __items_ordered; i++){
        const p = document.getElementById(i+'-price'); 
        const value = p?.value?p.value.replace(/[^\d]/g, ""):p.innerText.replace(/[^\d]/g, "")
        if (element === p || !p) continue
        total += parseInt(value || 0, 10);
    }

    clientPrice.value = total+parseInt(currentValue)
    if (clientVat){
        clientVat.placeholder = clientPrice.value;
    }

}

function compareVatOfPrice(t){
    const p_element = document.getElementById("client-price")
    const price = parseInt(p_element.value)
    const plhldr = parseInt(p_element.placeholder)
    if (!t.checked){
        p_element.value = plhldr
        return
    }

    p_element.value = price+(price*0.18)
    p_element.placeholder = price
}


function onPublishClientShowProgress(fullname, stat, done = false){
    const body = document.getElementById("clientOrderBody");
    const details = document.getElementById("clientOrderDetails");
    const progress = document.getElementById("clientProgressPublish");
    const fn = document.getElementById("cpp-fn")
    const st = document.getElementById("cpp-stat")
    const icon = document.getElementById("cpp-icon")
    const title = document.getElementById("cpp-title");
    const bAction = document.getElementById("beforeProgressDone");
    const aAction = document.getElementById("afterProgressDone");
    let iClass = "";
    if (!done){
        iClass = "fa-solid fa-circle-notch fa-spin"
        icon.classList = iClass
    }
    else{
        iClass ="fa-solid fa-calendar-check progress-icon-done ctype-"+stat;
        icon.classList = iClass
        title.textContent = 'ההזמנה נשמרה'
        title.classList.add("progress-title-done")
        aAction.classList.add("show");
        bAction.classList.add("hide");
        
        return;
    }

    fn.textContent = "עבור: "+fullname;
    st.children[0].textContent = getOrderStatText(parseInt(stat))
    body.classList.add("hide");
    details.classList.add("hide");
    progress.classList.add("show");
}   

function onPublishClientHideProgress(){
    const body = document.getElementById("clientOrderBody");
    const details = document.getElementById("clientOrderDetails");
    const progress = document.getElementById("clientProgressPublish");
    body.classList.remove("hide");
    details.classList.remove("hide");
    progress.classList.remove("show");

}


async function publishCleanOrder(order_id, state){
    if (c_runtime.blockPublishClient)return;
    if (!order_id){
        order_id = c_runtime.currentOrderIdView
        if (!order_id){
            showToast(message.EneedRefresh, ToastStat.ERROR);
            return
        }
    }
    c_runtime.blockPublishClient =true;
    const fullname = document.getElementById('fullname').value;
    const date = document.getElementById('client-date').value;
    const ldate = new Date(date);
    const time = document.getElementById('client-time').value;
    const [hours, minutes] = time.split(':').map(Number);
    ldate.setHours(hours, minutes, 0, 0);
    const timing = Math.floor(ldate.getTime() / 1000)
    const address = document.getElementById('client-location').value;
    const phone = document.getElementById('client-phone').value;
    const __items_ordered = document.getElementById('items-ordered').children.length;
    for (let i=0; i <= __items_ordered; i++){
        const n = document.getElementById(i+'-name');
        const p = document.getElementById(i+'-price'); 
        if (n==null||p==null)continue
        c_runtime.items_ordered[i] = {name:n.value||n.textContent, price:parseInt((p.value||p.textContent).replace(/\D+/g, ''),10)}

    }

    const notes = document.getElementById('client-notes').value;
    const price = document.getElementById('client-price').value;
    const vat = Boolean(document.getElementById('client-vat')?.checked)
    const offPrice = document.getElementById('client-off-price').value;
    const expense = document.getElementById("client-expense").value;
    const profitSharing = ft(document.getElementById("profitSharing").value);
    const workers = []
    for (w of document.getElementById('esm').children){
        workers.push(w.id.replace("s", ''))
    }
    const pay_type = document.getElementById("payGroup").dataset.tp
    const pay_notes = ''
    const order_type = c_clients.cot_selected;

    onPublishClientShowProgress(fullname, state);

    /** coordinate */
    const coordinates = await geocodeAddressOSM(address)
    const data = {action:OrdersApiCall.saveCleanOrder,
        oi:order_id, s:parseInt(state),
        phone:phone,o:Boolean(parseInt(offPrice)),
        op:offPrice,fn:fullname,
        address:address, i:JSON.stringify(c_runtime.items_ordered),
        lf:SocialMedia.WHATSAPP,date:timing,
        notes:notes,price:price,vat:vat,ex:expense,ps:profitSharing,workers:workers,coordinate:coordinates.specific, a_coordinate:coordinates.area,
        area_name:coordinates.areaName,
        pt:pay_type,pn:pay_notes,ot:order_type
    }
    const toast = showToast("מעבד...");
    return await new Promise((resolve) => ClientApi.saveOrder(data).then(
        async (res)=>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
                onPublishClientHideProgress();
            }else{
                onPublishClientShowProgress(fullname,state, true)
                c_runtime.items_ordered = {}
                showToast(res.notice, ToastStat.DONE, toast);
            }
            if (c_c_dashboard.newOrder){
                EventRegistry.emit(AppEvent.ORDER_CREATED, res)
            }
            else{
                EventRegistry.emit(AppEvent.ORDER_UPDATED, res)
            }
            
            c_runtime.blockPublishClient = false
            c_c_dashboard.editor = false;
            resolve();
        }
    ))

}


function closeSearchClients(t){
    closeSearchInput("searchClient", t)
    doSearchClientsLocal()
}

function searchOnOrders(){
    const input = document.getElementById("searchClient")
    const value = input.value.toLowerCase();
    let parentID = null;
    let listOrders = []
    if (configClients.currentView == clientsView.ORDERS){
        parentID = "listClients"
        listOrders = c_runtime.orders
    }
    else if (configClients.currentView == clientsView.TRASH){
        parentID = "listOrdersTrash"
        listOrders = c_runtime.ordersDeleled;
    }
    else if (configClients.currentView == clientsView.STM){
        parentID = "listOrderSTM"
        listOrders = c_runtime.orders.filter(o => o.marketplace_shared)
    }

    for (const order of listOrders){
        const order_id = order.order_id+parentID;
        const element = document.getElementById(order_id);
        if (isOrderVisibleInClientList(order, value)){
            element?.classList.remove("hide")
        }
        else{
            element?.classList.add("hide")
        }
    }



}
function isOrderVisibleInClientList(order, value){
    const phone = cleanPhoneJustNumbers(order.phone).includes(value);
    const name = order.fullname.toLowerCase().includes(value);
    const date = dateFloatToYMD(order.date).includes(value);
    const cid = order.client_id.toLowerCase() == value;
    const stat = order.stat&c_runtime.state_client_selected;
    const MWOffPrice = value.includes(magicWordSearchOrder[0]) && order.off_price;
    const MWReceipt = value.includes(magicWordSearchOrder[1]) && getReceiptsByOrderId(order.order_id);
    return (value == ''||phone||name||date||cid||MWOffPrice||MWReceipt) && stat;
}
function doSearchClientsLocal(){
    return searchOnOrders();
    
}

function get_client_by_order_id(order_id){
    const order = get_order_by_order_id(order_id)
    if (!order){return}
    const client = ClientStore.getClient(order.client_id)
    return client
}

function sortedClientsByState(){
    const parent = document.getElementById("listClients")
    for (const child of parent.children){
        if (parseInt(child.dataset.stat)&c_runtime.state_client_selected){
            child.classList.remove("hide")
        }
        else{
            child.classList.add("hide")
        }
    } 
}


function selectClientsState(stat, t){
    updateOrderStatSorted(t, t.dataset.s)

   // toggleFilterOptions('mf-cs')
}


function updateOrderStatSorted(t, stat, cache = true){
    const cSelected = "ac-selected"
    if (!t.classList.contains(cSelected)&& (!(stat&c_runtime.state_client_selected) || !cache)){
        t.classList.add(cSelected)
        c_runtime.state_client_selected |= stat
    }
    else{
        t.classList.remove(cSelected)
        c_runtime.state_client_selected &= ~stat
    }
    
    const viewOrderStatFilter = document.getElementById("viewOrderStatFilter");
    viewOrderStatFilter.textContent = `נבחר (${c_runtime.state_client_selected.toString(2).replace(/0/g, '').length})`;
    if (cache){
        updateOrderStatParamsAndCache(c_runtime.state_client_selected)
    }
    doSearchClientsLocal()
}

function updateMACSOnLoad(cache = true){
    const parent = document.getElementById("mf-cs").children
    for (const item of parent){
        const s = item.dataset.s
        if (c_runtime.state_client_selected&s){
            updateOrderStatSorted(item, s, cache)
        }
    }

}

function updateOrderStatParamsAndCache(state){
    const params = new URLSearchParams(window.location.search);
    params.set("s", state)
    window.history.replaceState({}, "", window.location.pathname + "?" + params.toString());
    ManagerCache.setClientsSortedState(state)
    c_runtime.state_client_selected = state
}



const menuItemsStateClients = [
    {text:'הושלם', action:(t)=>selectClientsState(t), icon:`<i class="fa-solid fa-clipboard-check"></i>`, stat:StateOrder.DONE},
    {text:'בהמתנה',action:(t)=>selectClientsState(t), icon:'<i class="fa-solid fa-hourglass-half ac2"></i>', stat:StateOrder.CLOSED},
    {text:'לא נסגר',action:(t)=>selectClientsState(t), icon:'<i class="fa-solid fa-question ac3"></i>', stat:StateOrder.WAIT},
    {text:'בוטל',action:(t)=>selectClientsState(t),icon:'<i class="fa-solid fa-ban ac4"></i>', stat:StateOrder.CANCELED},
]
function openMenuStateClients(t, stat){
    const menu = document.getElementById("stateClients")

    if (menu.classList.contains("show")) {
        menu.classList.remove("show")
        return
    }

    const rect = t.getBoundingClientRect()
    menu.innerHTML = ""

    let index = 1
    menuItemsStateClients.forEach(item => {
        let cma = document.createElement("div")
        cma.dataset.s = item.stat
        cma.className = "cma"
        let cma1 = document.createElement('div')
        cma1.className = "cma1"
        cma1.innerHTML = item.icon
        let cma2 = document.createElement("div")
        cma2.className = 'cma2'
        
        if (c_runtime.state_client_selected&item.stat){
            cma2.classList =`cma2 ac${index} ac-selected`
        }
        cma2.textContent = item.text
        cma.appendChild(cma1)
        cma.appendChild(cma2)

        cma.onclick = () => {
            item.action(cma)
            menu.classList.remove("show")
            openMenuStateClients(t, stat)
        }
        menu.appendChild(cma)
        index += 1
    })


    menu.classList.add("show")
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = rect.left;
    if (left + menuWidth > windowWidth) {
        left = windowWidth - menuWidth - 5;
    }

    // 👇 בדיקה לגובה
    let top;

    if (rect.bottom + menuHeight > windowHeight) {
        // אין מקום למטה → פותחים למעלה
        top = rect.top - menuHeight - 6;
    } else {
        // יש מקום → רגיל למטה
        top = rect.bottom + 6;
    }

    menu.style.top = `${top + window.scrollY}px`;
    menu.style.left = `${left + window.scrollX}px`;


}
const menuItemsClient = [
    { text: "צפיה", action: (cid, oid) => openClientDashbaord(cid, oid), icon:'<i class="fa-solid fa-eye"></i>'},
    { text: "עריכה", action: (cid, oid) => editExistOrder(oid), icon:'<i class="fa-solid fa-pencil"></>'},
    { text: "מחיקה", action: (cid, oid) => deleteOrder(oid), icon:'<i class="fa-solid fa-trash-can trash"></i>'},
    {text:'בוטל',action:(cid, oid)=>setStateCleanOrder(oid, StateOrder.CANCELED),icon:'<i class="fa-solid fa-ban"></i>'},
    {text:'הושלם', action:(cid, oid)=>setStateCleanOrder(oid, StateOrder.DONE), icon:'<i class="fa-solid fa-clipboard-check"></i>'},
    {text:'לא נסגר',action:(cid, oid)=>setStateCleanOrder(oid, StateOrder.WAIT), icon:'<i class="fa-solid fa-question"></i>'},
    {text:'בהמתנה',action:(cid, oid)=>setStateCleanOrder(oid, StateOrder.CLOSED), icon:'<i class="fa-solid fa-hourglass-half"></i>'},
    {text:'צור קבלה',action:(cid, oid)=>createInvoice(cid, oid), icon:'<i class="fa-solid fa-file-invoice"></i>'},
    {text:"העברת עבודה", action:(cid, oid)=>{initShareOrderToMarketplace(oid)}, icon:'<i class="fa-solid fa-globe"></i>'}


]

function openMenuClient(t, cid, oid) {
    console.log("openMenuClient", t, cid, oid)
    const menu = document.getElementById("clientMenu")
    if (menu.classList.contains("show")) {
        menu.classList.remove("show")
        return
    }
    const rect = t.getBoundingClientRect()
    menu.replaceChildren() 
    // const client = c_runtime.orders.find(c => c.client_id == cid)
    // const div = document.createElement("div")
    // div.innerText = client.fullname;
    // menu.appendChild(div)
    menuItemsClient.forEach(item => {
        let cma = document.createElement("div")
        cma.className = "cma"
        let cma1 = document.createElement('div')
        cma1.className = "cma1"
        cma1.innerHTML = item.icon
        
        let cma2 = document.createElement("div")
        cma2.className = 'cma2'
        cma2.textContent = item.text
        cma.appendChild(cma1)
        cma.appendChild(cma2)

        cma.onclick = () => {
            if (!item.action)return
            item.action(cid,oid)
            menu.classList.remove("show")
        }
        menu.appendChild(cma)
    })

    menu.classList.add("show")
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = rect.left;
    if (left + menuWidth > windowWidth) {
        left = windowWidth - menuWidth - 5;
    }

    // 👇 בדיקה לגובה
    let top;

    if (rect.bottom + menuHeight > windowHeight) {
        // אין מקום למטה → פותחים למעלה
        top = rect.top - menuHeight - 6;
    } else {
        // יש מקום → רגיל למטה
        top = rect.bottom + 6;
    }

    menu.style.top = `${top + window.scrollY}px`;
    menu.style.left = `${left + window.scrollX}px`;
}




function showCalendarOrders(t){
    
} 

async function onLoadEditClient(oid){
    editOrdersClient()
    await fetchWorkers()

    const order = get_order_by_order_id(oid)
    if (order){
        c_clients.cot_selected = order.order_type;
        for (let sw of c_runtime.workers){
            if (order.workers.includes(sw.employee_id)){
                selectWorkerToClient(sw)
            }

        }
    }

    let paymentState = 0;
    const group = document.getElementById("payGroup");
    const buttons = group.querySelectorAll("button");
    const icon = document.createElement("i")
    icon.className = "fa-solid fa-circle-check"
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const value = Number(btn.dataset.tp);
            paymentState = value;
            group.dataset.tp = value;
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            btn.appendChild(icon)
        });
    });

    setTimeout( ()=> {
        if (!order){
            document.getElementById("tp-default").click()
            return
        }
        const pt = order.payment_type
        group.querySelector(`[data-tp="${pt}"]`).click();
    }, 500);

    const clientVat = document.getElementById("client-vat")
    if (clientVat && order && order?.vat){
        clientVat.checked = true;
        compareVatOfPrice(clientVat)
    }

}

function onSearchWorker(){
    const input = document.getElementById("client-worker");
    const dropdown = document.getElementById("worker-dropdown");

    const value = input.value.toLowerCase();
    if (value == ''){
        hideDropdownWorkerSearch()
        return;
    };
    dropdown.innerHTML = "";

    const filtered = c_runtime.workers.filter(w =>
        w.username.toLowerCase().includes(value)
    );

    if(filtered.length === 0){
        hideDropdownWorkerSearch()
        return;
    }
    let x = 0
    filtered.forEach(worker=>{
        const parent = document.createElement("div");
        const icon = `<i class="fa-regular fa-user"></i>`
        const span = `<span>${worker.username}</span>`
        parent.className = "worker-search-item";
        parent.innerHTML = icon+span

        parent.onclick = () =>{
            selectWorkerToClient(worker)
        };

        if (x>2)return;
        dropdown.appendChild(parent);
        x+=1
    });
    showDropdownWorkerSearch()
}
function showDropdownWorkerSearch(){
    const dropdown = document.getElementById("worker-dropdown");
    dropdown.classList.add("show");
}
function hideDropdownWorkerSearch(){
    const dropdown = document.getElementById("worker-dropdown");
    dropdown.classList.remove("show");
}

function ft(nww){
    return parseInt(nww.replace(/[^\d]/g)||0)
}
/**
 * 
 * @param {{username:'', employee_id:''}} worker 
 */
function selectWorkerToClient(worker){
    if (document.getElementById("s"+worker.employee_id))return;
    const inputfw = document.getElementById("client-worker")
    inputfw.value =''
    onSearchWorker()
    const parent = document.getElementById("esm");
    const ws = document.createElement('div')
    ws.textContent = worker.username;
    ws.id = 's'+worker.employee_id;
    ws.classList.add("employee-selected");
    ws.onclick = () => {
        unSelectedworkerToClient(worker);
    }
    parent.appendChild(ws); 
    const toAdd = ws.offsetWidth+5
    inputfw.style.paddingRight = `${ft(inputfw.style.paddingRight)+toAdd}px`
    inputfw.style.width = `${inputfw.offsetWidth-ft(inputfw.style.paddingRight)}px`

    onSetWorkerToClient(worker)
}

function unSelectedworkerToClient(worker){
    const inputfw = document.getElementById("client-worker")
    const workerSelected = document.getElementById("s"+worker.employee_id);
    const toAdd = workerSelected.offsetWidth+5
    inputfw.style.width = `${inputfw.offsetWidth-ft(inputfw.style.paddingRight)}px`
    inputfw.style.paddingRight = `${ft(inputfw.style.paddingRight)-toAdd}px`
    workerSelected.remove();

    onSetWorkerToClient(worker);

}

function onSetWorkerToClient(worker){
    const profitSharing = document.getElementById("psharing")
    const lengthSelected = document.getElementById("esm")?.children.length;
    if (worker.username.includes("אני") || !lengthSelected){
        profitSharing.classList.remove("show")
        return;
    }
    profitSharing.classList.add("show")

}

async function fetchWorkers(){
    const data = {action:ApiCall.client_workers}
    return await new Promise((resolve) =>apiPost(ApiRoute.api, data).then( res =>{
        if (!res.success){
            showToast(res.notice, ToastStat.ERROR);
            resolve(null)
            return
        }
        c_runtime.workers = res.workers;
        resolve(res.workers)

    }))
}




document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const state = parseInt(params.get("s"))
    if (state){
        updateOrderStatParamsAndCache(state)
    }
    else{
        updateOrderStatParamsAndCache(ManagerCache.getClientsSortedState())
    }
    updateMACSOnLoad(false)

    document.addEventListener("click", e => {
        const menu = document.getElementById("clientMenu")
        if (!menu.contains(e.target) && !e.target.classList.contains("menu-client")) {
            menu.classList.remove("show")
            menu.classList.remove("hide")
        }
    })
});






// ===== Workers Schedule Functions =====

function switchClientsView(view) {
    
    const viewtabsItems = document.getElementById("viewtabs-items");
    for (tab of viewtabsItems.children){tab.classList.remove("active") }
    const containers = Object.values(itemOrderModes)
    containers.push('workersScheduleView')
    h = (el) => {document.getElementById(el)?.classList.add("hide");document.getElementById(el)?.classList.remove("show")}
    s = (el) => {document.getElementById(el)?.classList.add("show");document.getElementById(el)?.classList.remove("hide")}
    for (const container of containers) {
        h(container);
    }
    const ge = (t) => document.getElementById(`viewtab-${t}`)
    
    switch (view) {
        case (clientsView.ORDERS):
            ge(view).classList.add("active")
            s("listClients")
            break
        case (clientsView.TIMELINE):
            ge(view).classList.add("active")
            s("workersScheduleView")
            renderTimeLine()
            break
        case (clientsView.TRASH):
            ge(view).classList.add("active")
            s("listOrdersTrash")
            break
        case (clientsView.STM):
            ge(view).classList.add("active")
            s("listOrderSTM")
            break
    }
    configClients.currentView = view;
}



async function fetchClients() {
    return await new Promise((reslove) => ClientApi.listClients().then(
        (res) => {
            if (!res.success){
                showToast(message.EfetchClients)
                reslove(res);
                return;
            }
            ClientStore.setClients(res.clients);
            reslove(res);
        }
    ))
}

async function fetchOrders(){
    return await new Promise((reslove) => ClientApi.listOrders(c_runtime.showClientsFrom).then(
        res =>{
            if (!res.success){
                showToast(message.EfetchOrders)
                reslove(res);
                return
            }
            ClientStore.setOrders(res.orders);
            reslove(res);
        }
    ))
}



async function fetchOrdersDeleted(){
    const data = {action:OrdersApiCall.listCleanOrdersDeleted}
    await ClientApi.listDeletedOrders(data).then(
        (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR)
                return
            }
            c_runtime.ordersDeleled = res.orders;
            renderListOrdersTrash()
        }
    )

}

function updateExistingClientOrderItem(order, parentID, mode){
    alert("declared")
    return
    const element = document.getElementById(order.order_id+parentID);
    if (!element)return;

    element.dataset.stat = order.stat;
    element.dataset.key = order.key;
    element.innerHTML = createOrderItemHTML(mode, order.client_id, order);

    if (parentID == "listClients"){
        const input = document.getElementById("searchClient");
        const value = input?.value.toLowerCase() || "";
        element.classList.toggle("hide", !isOrderVisibleInClientList(order, value));
    }
}

ClientStore.subscribe(change => {
    if (change.entityType != "order" || !change.changedFields.includes("stat"))return;

    const order = change.entity;
    updateExistingClientOrderItem(order, "listClients", itemOrderModes.all);
    updateExistingClientOrderItem(order, "listClientOrders", itemOrderModes.dashboard);
});



async function reloadOnPageClients(view){
    if (!view){
        view = configClients.currentView
    }
    if (configClients.refreshView)return
    const toast = showToast("מרענן...");
    configClients.refreshView = true;
    if (view == clientsView.ORDERS){
        await fetchClients()
        await fetchOrders()
        renderListOrders()
    }
    else if (view == clientsView.TRASH){
        await fetchOrders()
        await fetchOrdersDeleted()
        renderListOrdersTrash()
    }
    else if (view == clientsView.STM){
        await fetchOrders()
        await fetchAvailablJobs()
        await fetchMyJobs()
        renderListOrdersSTM()
    }
    closeToast(toast)
    configClients.refreshView = false;

}


document.addEventListener("DOMContentLoaded", function (){
    switchClientsView(clientsView.ORDERS);
    EventRegistry.on(AppEvent.ORDER_CREATED, onOrderCreated)
    EventRegistry.on(AppEvent.ORDER_UPDATED, onOrderUpdate)

})
