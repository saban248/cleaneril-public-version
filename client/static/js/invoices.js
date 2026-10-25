

async function createImgInvoice(template, img, scale = 2){
    await html2canvas(template, { scale: scale, backgroundColor: '#fff'}).then(canvas => {
        img.src = canvas.toDataURL('image/png');
    });
}

function closeViewInvoice(){
    const parent = document.getElementById("viewInvoice");
    parent.classList.remove('show');
    parent.classList.add('hide');
} 


async function createInvoice(client_id = c_runtime.currentClientIdView, order_id = c_runtime.currentOrderIdView, dany){
    if (isCantExitEditOrder()){
        if (!askAboutExitEditOrder()){return}

    }
    const data = {action:ApiCall.invoice_create, cid:client_id, oid:order_id, stat:InvoiceStatType.PAID,
        is_c:false, cf:0,...dany
    }
    const toast = showToast(message.createInvoice)
    return await new Promise((reslove) => apiPost(ApiRoute.api, data).then(
        async res =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
                return
            }
            await fetchInvoice();
            showToast('נוצר בהצלחה',ToastStat.DONE, toast);
            reslove();


        }
    ))
}

function get_order_by_receipt_id(receipt_id){
    const receipt = c_runtime.invoices.find(r => r.receipt_id == receipt_id)
    if (!receipt){
        return null
    }
    const order = get_order_by_order_id(receipt.order_id)
    return order
}

function set_current_receipt_id_default(){
    const receipt = c_runtime.invoices.find(r => r.order_id == c_runtime.currentOrderIdView)
    c_runtime.currentInvoiceIdView = receipt?.receipt_id
}

async function deleteReceipt(receipt_id = c_runtime.currentInvoiceIdView, callback){
    const ok = await showAsk({msg:message.WdeleteReceipt})
    if (!ok)return
    
    if (!receipt_id){
        showToast(message.EselectReceipt, ToastStat.ERROR)
        return
    }
    const toast = showToast(message.loading)
    const data = {action:ApiCall.invoice_delete, iid:receipt_id}
    return await new Promise((resolve) => apiPost(ApiRoute.api, data).then(
        async (res) => {
            if (!res.success){
                showToast(res.notice,ToastStat.ERROR, toast);
                return
            }
            showToast(res.notice, ToastStat.DONE, toast)
            c_runtime.currentInvoiceIdView = null;
            await fetchInvoice()
            callback?callback():null
            resolve()
        }
    ))

}

async function fetchInvoice(){
    return await new Promise((reslove) => apiPost(ApiRoute.api, {action:ApiCall.invoice_list}).then(
        res => {
            if (!res.success){
                showToast(message.notice, ToastStat.ERROR)
                return
            }
            c_runtime.invoices = res.invoices;
            loadListInvoicesHtml()
            reslove()
        }
    ))
}

function loadListInvoicesHtml(){
    const parent = document.getElementById("listInvoices")
    parent.replaceChildren();
    c_runtime.invoices.forEach(receipt => {
        const el = createInvoiceItem(receipt);
        if (el==null)return
        parent.appendChild(el);
    });
}

function createInvoiceItem(invoice, actions = true, callback){
    const order = get_order_by_receipt_id(invoice.receipt_id)
    if (!order){
        return
    }
    const div = document.createElement("div");
    div.className = "cil-item "
    div.dataset.stat = invoice.stat;
    div.dataset.key = invoice.key;
    div.id = invoice.receipt_id;

    if (actions){
        div.ondblclick = () => {}
    }else{
        div.onclick = ()=> callback()
    }

    let html = '';
    if (actions && c_runtime.isInvoiceSelectMode) {
        html += `
            <div class="invoice-selection" style="padding: 0 10px;">
                <input type="checkbox" class="invoice-checkbox" value="${invoice.receipt_id}">
            </div>`;
    }
    html += `
        <div class="avatar invoice-state-${invoice.stat}">
        ${invoice.key}
        </div>
        <div class="content">
        <div class="in-content">
            <div class="top">
            <span class="name">${invoice.key.toString().padStart(4, '0')} | ${order.fullname}</span>
            <span class="phone no-mobile">${order.phone}</span>
            </div>
            <div class="bottom">
            <span>${dateFloatToYMD(invoice.date)} ${dateFloatToHour(invoice.date)}</span><br>
            <span>${order.price-order.off_price || 0}₪ •</span>
            <span class="invoice-state-text-${invoice.stat}">
                ${getInvoiceStatTypeText(invoice.stat)}
            </span>
            </div>
        </div>
        </div>
    `;

    if (actions){
        html += `
        <div class="client-footer">
        <i class="fa-solid fa-eye no-mobile"></i>
        <i class="fa-solid fa-share-from-square no-mobile"></i>
        <i class="fa-solid fa-bars menu-client"></i>
        </div>
        `;
    }

    div.innerHTML = html;

    if (actions) {
        const icons = div.querySelectorAll(".client-footer i");
        icons[0].onclick = () => viewInvoiceDetails(invoice.receipt_id);
        icons[1].onclick = () => downloadInvoiceAsImage(invoice.receipt_id);
        icons[2].onclick = (e) => openMenuClient(e.target, order.client_id, order.order_id);
    }

    return div;
}




async function viewInvoiceDetails(iid) {
    const res = await apiPost(ApiRoute.api, { action: ApiCall.invoice_view, iid: iid });
    if (res.success) {
        document.getElementById("invoice-template").innerHTML = res.template;
        document.getElementById("viewInvoice").classList.add("show");
    }
}
