const orderColumnAction = {
    restore:(order)=>`<i class="fa-solid fa-trash-restore menu-client" onclick="restoreOrder('${order.order_id}')"></i>`,
    showClientDashboard:(clientID, order)=>`<i class="fa-solid fa-eye menu-client no-mobile" onclick="openClientDashbaord('${clientID}', '${order.order_id}')"></i>`,
    menu:(clientID, order)=>`<i class="fa-solid fa-bars menu-client" onclick="openMenuClient(event.target, '${clientID}', '${order.order_id}')"></i>`,
    stm:(order)=>`<i class="fa-solid fa-globe show" onclick='initShareOrderToMarketplace("${order.order_id}")'></i>`,
    comment:(order, countComment)=>`<i class="fa-solid fa-comment show notifications-count" onclick='initShareOrderToMarketplace("${order.order_id}")'><span class='number-of-above ${countComment != 0?'noa-red':''}'>${countComment}</span></i>`,
    request:(order, countRequest)=>`<i class="fa-solid fa-hand show notifications-count" onclick='initShareOrderToMarketplace("${order.order_id}")'><span class='number-of-above ${countRequest != 0?'noa-red':''}'>${countRequest}</span></i>`
}

const itemOrderModes = {
    all:'listClients',
    trash:'listOrdersTrash',
    dashboard:'listClientOrders',
    stm:'listOrderSTM'
}


function clearList(parent){
    parent.replaceChildren();
}

function renderSharedLabel(order){
    if (!order.marketplace_shared)return '';
    const job = c_runtime.myJobs.find(j => j.order_id == order.order_id)
    let stateText;
    let stateColor;
    if (job){
        [stateText, stateColor] = getJobStateTextColor(job.state);
    }
    else if (thisCleanOrderShareWithMe(order.order_id)){
        [stateText, stateColor] = getJobStateTextColor(-1000)
    }
    else{return ''}

    return `
    <div class='order-shared' style='color:${stateColor};'>
        <i class='fa-solid fa-globe'></i>
        <span>${stateText}</span>
    </div>`
}
function renderColumnOrder(parentID, order, action, showPhone = true){
    return `
        <div class='client-item' data-stat='${order.stat}' data-key='${order.key}' id='${order.order_id+parentID}'>
            <div class="avatar client-state-${order.stat}">
            ${order.fullname?.[0] || "~"}
            </div>
            
            <div class="content">
            <div class="in-content">
                <div class="top ${showPhone?'':'in-content-top-mobile'}">
                    <div class="name ${order.marketplace_shared?'shared':''} ">
                        <span>${order.fullname}</span>
                        ${renderSharedLabel(order)}
                    </div>
                    <span class="phone no-mobile ${showPhone?'':'hide'}">${order.phone}</span>
                </div>
                <div class="bottom">
                    <span>${dateFloatToYMD(order.date)} ${dateFloatToHour(order.date)}</span><br>
                    <span>${order.price -order.off_price || 0}₪ •</span>
                    <span class="client-state-text-${order.stat}">
                        ${getOrderStatText(order.stat)}
                    •</span>
                    <i class="${getCleanOrderTypeIcon(order.order_type)}"></i>

                </div>
            </div>
            </div>
            <div class="client-footer">
                ${action}
            </div>
        </div>
    `;
}
function renderColumnOrderAll(parentID, order){
    const actions = orderColumnAction.showClientDashboard(order.client_id, order)+orderColumnAction.menu(order.client_id, order);
    return renderColumnOrder(parentID, order,actions)
}
function renderColumnOrderClientDashboard(parentID, order){
    const actions = ''
    return renderColumnOrder(parentID,order,actions,false)
}
function renderColumnOrderRestore(parentID, order){
    const actions = orderColumnAction.restore(order)
    return renderColumnOrder(parentID,order,actions)
}

function renderColumnOrderSTM(parentID, order){
    const job = c_runtime.myJobs.find(j => j.order_id == order.order_id);
    if (!job)return ''
    const countRequest = getCountRequestsNotViewed(job.job_id);
    const countComment = job.comments.length;
    const actions = orderColumnAction.stm(order)+
    orderColumnAction.comment(order,countComment)+
    orderColumnAction.request(order,countRequest)
    return renderColumnOrder(parentID,order,actions)
}
/**
 * 
 * @param {String} parentID 
 * @param {Object} list 
 * @param {object} actions 
 * @param {CallableFunction} render 
 * @returns 
 */
function renderListOrders(parentID, list, render, onclick, dbclick, selectedBy){
    const parent = document.getElementById(parentID)
    if (!parent){return}
    clearList(parent);
    
    list.forEach(order => {
        const el = render(parentID, order);
        parent.insertAdjacentHTML('beforeend', el);
        const element = document.getElementById(order.order_id+parentID)
        if (!element){return}
        if (onclick){element.onclick = () => onclick(order);}
        else if (dbclick){element.ondblclick = () => dbclick(order);}
        if (selectedBy&&selectedBy(order)){
            element.classList.add("order-selected-cd-list")
        }
    });
    doSearchClientsLocal()
}


function renderListOrdersAll(){
    const list = c_runtime.orders;
    return renderListOrders(itemOrderModes.all, list, renderColumnOrderAll, null, (o) =>openClientDashbaord(null,o.order_id))
}
function renderListOrdersTrash(){
    const list = c_runtime.ordersDeleled;
    return renderListOrders(itemOrderModes.trash, list, renderColumnOrderRestore);

}
async function onSelectCDOrder(order){
    await initClientOrder(order.order_id);
    renderListOrdersClientDashboard()
}
function renderListOrdersClientDashboard(){
    const list = c_runtime.orders.filter(o=>o.client_id == c_runtime.currentClientIdView)
    return renderListOrders(itemOrderModes.dashboard, list, renderColumnOrderClientDashboard,onSelectCDOrder,null,
        (order)=>order.order_id==c_runtime.currentOrderIdView
    )
}

function renderListOrdersSTM(){
    const list = c_runtime.orders.filter(o=>o.marketplace_shared);
    return renderListOrders(itemOrderModes.stm, list, renderColumnOrderSTM, null,(o) =>openClientDashbaord(null,o.order_id))
}