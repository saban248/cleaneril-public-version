const c_clients = {
    client_view:false,
    receipt_edit:false,
    cot_selected:CleanOrderType.UPHOLSTERY,
    lastDashboardView:clientsView.ORDERS
}

function isCantExitEditOrder(){
    return c_c_dashboard.editor
}

async function askAboutExitEditOrder(){
    if (!c_c_dashboard.editor)return false

    const answer = await showAsk({msg:message.IunsaveOrder});
    if (answer){
            c_c_dashboard.editor = false;
         
    }
    return answer

}

async function closeClientDashboard(){
    if (c_c_dashboard.newOrder){
        const deleted = await deleteOrder(c_runtime.currentOrderIdView)
        if (!deleted)return
        
    }
    else if (isCantExitEditOrder()){
        const a = await askAboutExitEditOrder()
        if (!a){ 
            return
        }

    }
    delete c_runtime.clientsReports[c_runtime.currentClientIdView]
   c_c_dashboard.reset();
   hideClientDashboard()
}


async function showClientDashboard(){
    const mainEdit = document.getElementById("client-dashboard");
    mainEdit.innerHTML = await renderClientDashboard()
    mainEdit.classList.add('show');
}
function hideClientDashboard(){
    const mainEdit = document.getElementById("client-dashboard")
    setTimeout(()=>{mainEdit.replaceChildren()}, 500)
    mainEdit.classList.remove('show');

}

async function openClientDashbaord(client_id = c_runtime.currentClientIdView, order_id = c_runtime.currentOrderIdViewn, view = clientCardsView.ORDER){
    
    if (client_id & !order_id){
        setCurrentOrderIdAsNext()
        order_id = c_runtime.currentOrderIdView;
    }
    c_runtime.currentClientIdView = client_id;
    c_runtime.currentOrderIdView = order_id;
    c_c_dashboard.enter = true;
    await showClientDashboard()
    await initClientOrder(order_id)

    c_c_dashboard.enter = true;
    switchViewClientDashboard(view)
}


async function initClientOrder(order_id){
    const order = await fetchClientOrder(order_id);
    if (!order){
        showToast(res.notice, ToastStat.ERROR);
        return;
    }
    const orderTemplate = document.getElementById('the-client-card')
    orderTemplate.innerHTML = renderClientOrder(order, c_c_dashboard.editor)
    c_runtime.currentClientIdView = order.client_id;
    c_runtime.currentOrderIdView = order.order_id;
    c_c_dashboard.currentDView = clientCardsView.ORDER;
    c_c_dashboard.inOrder = true;
    if (c_c_dashboard.editor){
        onLoadEditClient(order.order_id)
    }

    showClientOrder()
}


async function fetchClientOrderInvoice(iid){
    if (!iid){
        showToast(message.EselectReceipt);
        return
    }
    const toast = showToast("מעבד...");
    data = {action:ApiCall.invoice_view, iid:iid}
    return await new Promise((reslove) => apiPost(ApiRoute.api, data).then(
        (res) => {
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
                return
            }
            c_runtime.currentInvoiceIdView = iid
            c_c_dashboard.currentDView = clientCardsView.RECEIPT
            const template = document.getElementById("receiptTemplate");
            template.innerHTML = res.template;
            showToast(res.notice, ToastStat.DONE, toast)
            c_c_dashboard.inOrder = true;
            reslove();
        }
    ))
}

async function createClientOrderInvoiceImg(iid, scale = 2){
    if (iid == undefined || c_runtime.blockRenderReceiptImg)return
    c_runtime.blockRenderReceiptImg = true;
    await fetchClientOrderInvoice(iid)
    const template = document.getElementById("receiptTemplate");
    const img = document.getElementById("imgReceipt");
    const icon = document.getElementById("before-load-receipt");
    icon.style.display = 'none'
    template.style.display = 'block'
    await createImgInvoice(template, img, scale)
    img.style.display = 'block'
    template.style.display = 'none'
    c_runtime.blockRenderReceiptImg = false;
}
function removeOrderReceiptImg(){
    const img = document.getElementById("imgReceipt");
    const icon = document.getElementById("before-load-receipt");
    icon.style.display = 'block'
    img.style.display = 'none'
    img.src =''

}


function switchClientCardAction(){
    const show = (element) => element.classList.add('show')
    const hide = (element) => element.classList.remove('show')

    const AView = document.getElementById("clientCardAViews");
    const ainto = document.getElementById("actionIntoCard");
    // return from card
    const arfc = document.getElementById("arfc");
    // close client dashboard
    const accd = document.getElementById("accd");
    const btns = [AView,ainto, arfc, accd]
    for(let b of btns){hide(b)}
    const SpecificId = (c_c_dashboard.currentDView == clientCardsView.ORDER && c_runtime.currentOrderIdView !=null)
            || (c_c_dashboard.currentDView == clientCardsView.RECEIPT && c_runtime.currentInvoiceIdView !=null)

    if (c_c_dashboard.inOrder && IS_MOBILE){
        if (SpecificId){
            show(ainto)
            
        }
        show(arfc)

    }
    else if (!IS_MOBILE){
        if (SpecificId){
            show(ainto)
        }   
        show(AView)
        show(accd)
    }
    else{
        show(AView)
        show(accd)
    }
    if (c_c_dashboard.inStm){
        show(arfc)
    }

}
async function switchViewClientDashboard(v = c_c_dashboard.currentDView, back = false){
    if (isCantExitEditOrder()){
        if (!(await askAboutExitEditOrder())){return}
    }
    if (c_clients.currentOrderIdView && c_c_dashboard.newOrder){
        showToast("סיים יצירת הזמנה חדשה לפני", ToastStat.ERROR)
        return
    }
    const parentBody = document.getElementById("client-template-dashboard")
    parentBody.scrollTop = 0;
    c_c_dashboard.lastDView = c_c_dashboard.currentDView;
    if (!v){v = c_c_dashboard.currentDView}
    switch (v){
        case clientCardsView.ORDER:
            if (!c_c_dashboard.newOrder){
                showClientOrders()
            }
            if (!back && c_c_dashboard.inOrder){
                
                await initClientOrder(c_runtime.currentOrderIdView)
            }
            hideClientReceipts()
            hideClientReceipt()
            hideClientReports()
            hideClientShareMarketplace()
            break
        case clientCardsView.RECEIPT:
            showClientReceipts()
            if (!back && c_c_dashboard.inOrder){
                showClientReceipt(c_runtime.currentInvoiceIdView)
            }
            hideClientOrder()
            hideClientOrders()
            hideClientReports()
            hideClientShareMarketplace()
            break
        case clientCardsView.REPORTS:
            showClientReports()

            hideClientOrder()
            hideClientOrders()
            hideClientReceipt()
            hideClientReceipts()
            hideClientShareMarketplace()
            break
        case clientCardsView.SHARE_MARKETPLACE:
            showClientShareMarketplace()

            hideClientOrder()
            hideClientOrders()
            hideClientReceipt()
            hideClientReceipts()
            hideClientReports()
            break
    }
    const lastBtnView = document.getElementById(`cdv${c_c_dashboard.lastDView}`)
    const currentBtnView = document.getElementById(`cdv${v}`)
    if (currentBtnView){
        lastBtnView?.classList.remove("current-cdv")
        currentBtnView.classList.add("current-cdv")
    }
    c_c_dashboard.currentDView = v
    if (back){c_c_dashboard.inOrder = false;}
    switchClientCardAction()
    switchMenuActionClientCard()

}


function switchMenuActionClientCard(){
    const parent = document.getElementById("cdMActions");
    const menu = document.getElementById("actionIntoCard");
    switch (c_c_dashboard.currentDView){
        case clientCardsView.ORDER:
            menu.innerHTML = renderActionsOrder()
            break
        case clientCardsView.RECEIPT:
            menu.innerHTML = renderActionsReceipt()
            break
        case clientCardsView.SHARE_MARKETPLACE:
            break
    }
}

 
async function createListClientReceipts(){
    const parent = document.getElementById("listClientReceipts");
    const currentClient = c_runtime.orders.find(c=> c.client_id == c_runtime.currentClientIdView);
    if (!c_runtime.invoices || !currentClient){
        const icon = document.getElementById('iel-receipts');
        icon.style.display = 'block'
        parent.classList.add("icon-empty-list")
        return
    }
    else{
        parent.classList.remove("icon-empty-list")
    }

    parent.replaceChildren();
    for (let receipt of c_runtime.invoices.filter(r => r.client_id == c_runtime.currentClientIdView)){
        const element = createInvoiceItem(receipt,false, async ()=>{
           showClientReceipt(receipt.receipt_id);
           createListClientReceipts()
        }
        )
        if (!element){continue}
        if (receipt.receipt_id == c_runtime.currentInvoiceIdView){
            element.classList.add('current-client-list');
        }
        parent.appendChild(element);
    }   
}



async function showClientOrder(){
    const card = document.getElementById("the-client-card")
    card.classList.add("show")
    if (IS_MOBILE){
        hideClientOrders()
    }
    switchClientCardAction()
    switchMenuActionClientCard()
}


function hideClientOrder(){
    const card = document.getElementById("the-client-card")
    card?.classList.remove("show")

}

function showClientOrders(){
    const parent = document.getElementById("the-client-orders")
    if (!parent){
        showToast(message.EneedRefresh, ToastStat.ERROR)
        return;
    }
    if (IS_MOBILE){
        hideClientOrder()
    }
    switchClientCardAction()
    if (parent.classList.contains("show")){
        return;
    }
    parent.classList.add("show")
    renderListOrdersClientDashboard()

}
function hideClientOrders(){
    const parent = document.getElementById("the-client-orders")
    parent?.classList.remove("show")

}

async function showClientReceipt(iid = c_runtime.currentInvoiceIdView, fetch = true){
    const invoice = document.getElementById("the-client-invoice");
    invoice.classList.add("show")
    if (IS_MOBILE){
        hideClientReceipts()
    }
    c_c_dashboard.inOrder = true;
    if (fetch){
        setTimeout(() => createClientOrderInvoiceImg(iid, 2), 500)
    }
    switchClientCardAction()
}
function hideClientReceipt(){
    const invoice = document.getElementById("the-client-invoice");
    invoice?.classList.remove("show")
}
function showClientReceipts(){
    const parent = document.getElementById("the-client-receipts");
    if (IS_MOBILE){
        hideClientReceipt()
    }
    switchClientCardAction()
    if (parent.classList.contains("show")){
        return;
    }
    parent.classList.add("show")
    if (!c_runtime.currentInvoiceIdView){
        set_current_receipt_id_default()
    }
    createListClientReceipts();
}

function hideClientReceipts(){
    const parent = document.getElementById("the-client-receipts");
    parent?.classList.remove("show")

}

function hideClientReports(){
    const parent = document.getElementById("client-reports")
    parent?.classList.remove("show")
}

async function showClientReports(){
    const parent = document.getElementById("client-reports")
    parent.classList.add("show")
    renderClientSummaryReport()
}

function editReceiptOrder(){
    const rid = c_runtime.currentInvoiceIdView
    const timg = document.getElementById("receiptImgTemplate");
    const tedit = document.getElementById("receiptEditTemplate");
    timg.classList.remove("show");
    tedit.classList.add("show")

    c_clients.receipt_edit = true;
    switchMenuActionClientCard()
}

function closeEditReceiptOrder(){
    const timg = document.getElementById("receiptImgTemplate");
    const tedit = document.getElementById("receiptEditTemplate");
    timg.classList.add("show");
    tedit.classList.remove("show")

    c_clients.receipt_edit = false;
    switchMenuActionClientCard()
}


async function showClientShareMarketplace(){
    const order = ClientStore.getOrder(c_runtime.currentOrderIdView);
    if (!order){return}
    c_stm.reset();
    c_stm.init(order?.marketplace_shared?STMMode.VIEW:STMMode.CREATE)
    const parent = document.getElementById("uiShareOrderMarketplace");
    parent.classList.add("show")
    parent.innerHTML = await renderShareToMarketplace()
    showSTMPart(c_stm.currentPart)
    const arfc = document.getElementById("arfc");
    const accd = document.getElementById("accd")
    arfc.onclick = ()=>{backFromPartOnStm()}
    accd.onclick = ()=>{closeShareToMarketplace()}

}

function hideClientShareMarketplace(){
    const parnet = document.getElementById("uiShareOrderMarketplace");
    parnet.classList.remove("show");
    parnet.replaceChildren();
    const arfc = document.getElementById("arfc");
    const accd = document.getElementById("accd")
    arfc.onclick = ()=>{switchViewClientDashboard(null, true)}
    accd.onclick = ()=>{closeClientDashboard()}
}



/** ACTIONS */

async function editExistOrder(order_id = c_runtime.currentOrderIdView){
    c_c_dashboard.editor = true; 
    if (c_c_dashboard.enter){
        await initClientOrder(order_id)
        switchMenuActionClientCard()
        return
    }
    await openClientDashbaord(c_runtime.currentClientIdView, order_id)
}

function shareReceiptToClientAsPhoto(iid = c_runtime.currentInvoiceIdView){

}


async function initSelectOrderTypeToCreate(){
    c_c_dashboard.newOrder = true;
    await openClientDashbaord(null, null, false)
    showSelectOrderTypeToCreate();

}

function filterTypeCleanOrderItems(value = "") {
    const tcoItems = document.getElementById("tcoItems");
    if (!tcoItems) return;

    const searchValue = (value || "").trim().toLowerCase();
    const items = tcoItems.querySelectorAll(".tco-item");

    items.forEach((item) => {
        const itemText = (item.dataset.searchText || item.textContent || "").toLowerCase();
        const matches = !searchValue || itemText.includes(searchValue);
        item.classList.toggle("is-hidden", !matches);
        if (matches) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
}

function setupTypeCleanOrderSearch() {
    const searchInput = document.getElementById("tcoSearch");
    if (!searchInput) return;

    searchInput.oninput = (event) => filterTypeCleanOrderItems(event.target.value);
}

function showSelectOrderTypeToCreate(exist = false){
    const typeClean = document.getElementById("typeCleanOrder");
    const tcoItems = document.getElementById("tcoItems");
    if (tcoItems.children.length){
        typeClean.classList.remove("show")
        tcoItems.replaceChildren()
        return;
    }
    for (let [flag_name, flag] of Object.entries(CleanOrderType)){
        const name = getCleanOrderTypeText(flag)
        const icon = getCleanOrderTypeIcon(flag)
        const searchableName = `${name}`.toLowerCase();
        const html = `
        <div class="tco-item" data-search-text="${searchableName}" onclick="SelectOrderTypeToCreate(this, ${flag},${exist});showSelectOrderTypeToCreate()">
            <div class="tcoi-header">
                ${name}
            </div>
            <div class="tcoi-body">
                <i class="${icon}"></i>
            </div>
        </div>`
        tcoItems.innerHTML += html;
    }

    const searchInput = document.getElementById("tcoSearch");
    if (searchInput) {
        searchInput.value = "";
    }

    setupTypeCleanOrderSearch();
    filterTypeCleanOrderItems("");
    typeClean.classList.add("show")
}



function editExistCleanOrderType(element, flag) {
    c_clients.cot_selected = flag;
    const displaySpan = document.getElementById("dc1");
    if (displaySpan) displaySpan.textContent = getCleanOrderTypeTitle(flag);
    document.getElementById("typeCleanOrder")?.classList.remove("show");
}

function SelectOrderTypeToCreate(t, cot, exist = false){
    c_clients.cot_selected = cot;
    t.classList.add("selected")
    setTimeout(()=>{
        if (exist){
            editExistCleanOrderType(t, cot)
        }else{
        createOrder()
        }}, !exist ? 500 : 0)
}

async function createOrder(){
    c_c_dashboard.newOrder = true;
    await openClientDashbaord(null, null, false)
}

function onSelectClientNewOrder(order){
    document.getElementById("fullname").value = order.fullname
    document.getElementById("client-phone").value = order.phone;
    document.getElementById("client-date").value = new Date().toISOString().split("T")[0];
    document.getElementById("client-location").value = order.address;
    document.getElementById("client-notes").value = order.notes;
    document.getElementById("client-price").value = order.price;
    docum
    const parent = document.getElementById("items-ordered");
    parent.replaceChildren();
    for (let [k,v] of Object.entries(order.items)){
        addItemClientOrder(v.name,v.price)
    }
}
function searchClientNewOrder(e){
    const value = e.target.value.toLowerCase();
    if (value == '')return

    const orders = c_runtime.orders.filter(o => o.fullname.toLowerCase().includes(value))
    const items = []
    for (let order of orders.slice(0, 4)){
            items.push({text:order.fullname, value:order.order_id, icon:"fa-solid fa-user"})
        
    }
    
    buildFilterOptions("mf-sc",items,(orderId)=>{onSelectClientNewOrder(get_order_by_order_id(orderId))})

}

function editOrdersClient(){
    const parent = document.getElementById("items-ordered");

    const children = parent.children
    const length = children.length;
    const temp = []
    for (let index=0;index<length;index++){
        const name = children[index].children[0].textContent
        const price = children[index].children[1].textContent
        temp.push([name, price.replace(/[^\d]/g, "")])
    }
    parent.replaceChildren()
    for (edit of temp){
        addItemClientOrder(edit[0], edit[1]);
    }

}

function onSearchProductToOrder(index, value){
    const items = []
    const max = 5
    for (const product of c_runtime.products.filter(p =>p.raw.includes(value)).slice(0, max)){
        items.push({text:product.raw, icon:'fa-solid fa-barcode', value:product.key})
    }
    
    buildFilterOptions("mf-sp"+index, items, 
        (pk)=>{onSelectProductToOrder(index,getCILProductByKey(pk))},true)

}

function onSelectProductToOrder(index, product){
    const inputName = document.getElementById(`${index}-name`)
    const inputPrice = document.getElementById(`${index}-price`)
    inputName.value = product.raw;
    inputPrice.value = product.price;
    mainSyncTotalPrice(inputPrice)
}
function addItemClientOrder(name, price) {
    const items = document.getElementById("items-ordered");

    const div = document.createElement("div");
    div.className = "ordered";
    div.id = items.childElementCount;
    const inputName = document.createElement("input");
    inputName.classList.add('c-input-item-name')
    inputName.id = `${div.id}-name`
    if (name){
        inputName.value = name;
    }
    inputName.addEventListener('input', (e)=>{
        const value = e.target.value;
        if (!value || value == '')return
        onSearchProductToOrder(div.id, value)
    })


    const inputPrice = document.createElement("input");
    inputPrice.oninput = (e)=>{mainSyncTotalPrice(e.target)}
    inputPrice.classList.add('c-input-fn')
    inputPrice.type = 'tel'
    inputPrice.id = `${div.id}-price`
    if (price){
        inputPrice.value = price;
    }

    const trash = document.createElement('i')
    trash.classList = "fa-solid fa-trash-can trash-order"
    trash.onclick = ()=>{deleteItemClientOrder(div.id)}

    const filter = document.createElement("div")
    filter.className = 'filter-options'
    filter.id = 'mf-sp'+div.id
    
    div.append(inputName, inputPrice, trash, filter);
    items.appendChild(div);
    c_runtime.items_ordered[div.id] = {name:name||'unknown',price:price||0}
    if (!name && !price) animateNewOrderItem(div)
}

function animateNewOrderItem(item){
    const input = item.querySelector('.c-input-item-name')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        input?.focus()
        return
    }
    const button = document.querySelector('.ci-add-item')
    if (!button){
        input?.focus()
        return
    }

    const buttonBox = button.getBoundingClientRect()
    const itemBox = item.getBoundingClientRect()
    const startX = buttonBox.left + buttonBox.width / 2 - 10
    const startY = buttonBox.top + buttonBox.height / 2 - 10
    const endX = itemBox.left + 12 - startX
    const endY = itemBox.top + itemBox.height / 2 - 10 - startY
    const flyItem = document.createElement('span')
    flyItem.className = 'item-order-fly'
    flyItem.innerHTML = '<i class="fa-solid fa-plus"></i>'
    flyItem.style.left = `${startX}px`
    flyItem.style.top = `${startY}px`
    flyItem.style.setProperty('--fly-mid-x', `${endX * .55}px`)
    flyItem.style.setProperty('--fly-mid-y', `${endY * .55 - 18}px`)
    flyItem.style.setProperty('--fly-x', `${endX}px`)
    flyItem.style.setProperty('--fly-y', `${endY}px`)
    document.body.appendChild(flyItem)
    item.style.opacity = '0'
    window.setTimeout(()=>{
        flyItem.remove()
        item.style.opacity = ''
        item.classList.add('item-order-landed')
        window.setTimeout(()=> item.classList.remove('item-order-landed'), 160)
        input?.focus()
    }, 390)
}

function deleteItemClientOrder(id_order){
    const parent = document.getElementById(id_order)
    if (!parent || parent.dataset.removing)return
    parent.dataset.removing = 'true'
    const element = document.getElementById(id_order+"-price")
    element.value  = 0
    mainSyncTotalPrice(element)
    delete c_runtime.items_ordered[id_order]
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        parent.remove()
        return
    }
    parent.classList.add('item-order-evaporating')
    window.setTimeout(()=> parent.remove(), 280)
}

async function deleteReceiptFromDashbaord(receipt_id = c_runtime.currentInvoiceIdView){
    const success = () =>{
        switchViewClientDashboard(c_c_dashboard.currentDView,false, true)
        createListClientReceipts()
        removeOrderReceiptImg();
    }
    await deleteReceipt(receipt_id, success)
}

async function createReceiptFromDashbaord() {
    const createReceipt = await showAsk({title:message.notice, msg:message.IAboutCreateReceipt})
    if (!createReceipt){return}
    await createInvoice()
    switchMenuActionClientCard()
}

async function publisCleanOrderFromDashboard(stat) {
    await publishCleanOrder(c_runtime.currentOrderIdView, stat)
    switchMenuActionClientCard()
}


async function setStateCleanOrder(order_id = c_runtime.currentOrderIdView, state){
    return null
}


document.addEventListener("DOMContentLoaded", function(){
    EventRegistry.on(AppEvent.ORDER_STM, onOrderSTM)
    EventRegistry.on(AppEvent.ORDER_DELETED, onOrderDeleted)
    EventRegistry.on(AppEvent.ORDER_DUPLICATE)
})