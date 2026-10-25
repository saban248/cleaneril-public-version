const c_reports = {
    clientReportsTimeout: {},
    clientActivityViewShort:true
}

async function fetchClientReports(clientId) {
    if (!clientId){
        clientId = c_runtime.currentClientIdView;
    }
    const data = {action:ApiCall.client_reports, client_id:clientId}
    const toast = showToast('מוריד...');
    await apiPost(ApiRoute.api, data).then(
        (res) =>{
            if (!res.success){
                showToast(res.notice,ToastStat.ERROR, toast);
                return
            }
            c_runtime.clientsReports[clientId] = res.reports;
            closeToast(toast);
        }
    )
    
}


function reportEscapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, function(char){
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        }[char];
    });
}

function reportMoney(value){
    const amount = Number(value || 0);
    return `${amount.toLocaleString("he-IL")}`;
}

function reportDate(value){
    if (!value){
        return "ללא תאריך";
    }
    return `${dateFloatToYMD(value)} ${dateFloatToHour(value)}`;
}

function getClientReportCoordinates(order){
    if (!order){
        return null;
    }  

    let coordinates = order.coordinates;
    if (!coordinates){
        return null;
    }

    if (!Array.isArray(coordinates) || coordinates.length < 2){
        return null;
    }

    const lat = parseFloat(coordinates[0]);
    const lng = parseFloat(coordinates[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)){
        return null;
    }

    return [lat, lng];
}

async function renderClientReportProfileMap(order){
    const mapEl = document.getElementById("clientReportProfileMap");
    if (!mapEl || typeof L == "undefined"){
        return;
    }

    let coordinates = getClientReportCoordinates(order);
    if (!coordinates && order?.address){
        coordinates = await geocodeAddressOSM(order.address)?.specific;
    }
    if (!coordinates){
        mapEl.classList.add("hide");
        return;
    }

    if (c_runtime.clientReportProfileMap){
        c_runtime.clientReportProfileMap.remove();
        c_runtime.clientReportProfileMap = null;
    }

    const map = L.map(mapEl, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: false,
        tap: true
    }).setView(coordinates, 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20
    }).addTo(map);

    L.circleMarker(coordinates, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#ef4444",
        fillOpacity: 1
    }).addTo(map);

    c_runtime.clientReportProfileMap = map;
    setTimeout(() => map.invalidateSize(), 1000);
}

function reportOrderTotal(order){
    if (!order){
        return 0;
    }

    if (order.items && Object.keys(order.items).length){
        let total = 0;
        for (const item of Object.values(order.items)){
            total += parseInt(item.price) || 0;
        }
        return Math.max(0, total - (parseInt(order.off_price) || 0));
    }

    return Math.max(0, (parseInt(order.price) || 0) - (parseInt(order.off_price) || 0));
}


function getClientReportOrders(){
    const primaryOrder = getClientReportPrimaryOrder();
    if (!primaryOrder){
        return [];
    }

    const primaryPhone = cleanPhoneJustNumbers(primaryOrder.phone || "");
    return c_runtime.orders.filter(function(order){
        const samePhone = primaryPhone && cleanPhoneJustNumbers(order.phone || "") == primaryPhone;
        const sameClient = c_runtime.currentClientIdView && order.client_id == c_runtime.currentClientIdView;
        return samePhone || sameClient;
    });
}

function getClientReportReceipts(orders){
    const orderIds = orders.map(order => String(order.order_id));
    return c_runtime.invoices.filter(function(receipt){
        return orderIds.includes(String(receipt.order_id)) && !receipt.is_credit;
    });
}


function buildClientReportEvents(orders, receipts){
    const orderEvents = orders.map(function(order){
        return {
            date: order.date,
            icon: getCleanOrderTypeIcon(order.order_type),
            title: `הזמנה ${order.key || order.order_id || ""}`,
            text: `${getOrderStatText(order.stat)} · ${order.fullname || ""}`,
            amount: reportOrderTotal(order),
            type: "order"
        };
    });

    const receiptEvents = receipts.map(function(receipt){
        const order = orders.find(item => item.order_id == receipt.order_id);
        return {
            date: receipt.date,
            icon: "fa-solid fa-file-invoice",
            title: `קבלה ${String(receipt.key || receipt.receipt_id || "").padStart(4, "0")}`,
            text: `${getInvoiceStatTypeText(receipt.stat) || "תשלום"} · ${order?.fullname || ""}`,
            amount: reportOrderTotal(order),
            type: "receipt"
        };
    });

    return orderEvents.concat(receiptEvents).sort(function(a, b){
        return (b.date || 0) - (a.date || 0);
    });
}

async function renderClientHistory(histories){
    if (!histories.length){
        return `<div class="client-report-empty">
            <span>אין אירועים להצגה</span>
            <i class="icon icon-48">${await icon("no-events")}</i>
        </div>`
    }
    let end = 5
    if (!c_reports.clientActivityViewShort){
        end = histories.length;
    }
    const Html = histories.slice(0, end).map(function(event){
        const entityTitle = getClientHistoryEntityTitle(event.entity)
        const actionText = getClientHistoryActionText(event.action)
        const entityIcon = getClientHistoryEntityIcon(event.entity)
        const createdAt = new Date(event.created_at * 1000).toLocaleDateString("he-IL", {
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",

        });
        const changed = Object.values(event.data)?.map(d => d.description).join(", ")
        const reverse = Object.values(event.data).every(d => d.reverse === true);
        const hid = event.history_id;
        return `
            <div class="client-report-event client-report-event-${event.entity}" id="${hid}">
                <div class="client-report-event-icon">
                    <i class="${entityIcon}"></i>
                </div>
                <div class="client-report-event-content">
                    <strong>${entityTitle} ${actionText}</strong>
                    <small>${createdAt}</small>
                    <span>${changed?"שינויים: ":"אין מידע"}${changed}</span>
                </div>
                <div class="client-report-event-amount">${event.data.length}</div>
                <div class="client-report-event-action">
                    <i class="fa-solid fa-trash btn-r-show-calendar" onclick="deleteClientHistory('${hid}')"></i>
                    ${reverse? `<i class="fa-solid fa-clock-rotate-left btn-r-show-calendar"onclick="restoreClientHistoryAction('${hid}')"></i>`:''}
                    <i class="fa-solid fa-info btn-r-show-calendar" onclick="showInfoClientHistory('${hid}')"></i>
                </div>
            </div>
        `;
    }).join("");

    return Html
}

async function createClientHistory(){
    const lengthView = document.getElementById('clientReportEventsListLength');
    const parent = document.getElementById("clientReportEventsList");
    const histories = c_runtime.clientsReports[c_runtime.currentClientIdView].history;
    parent.innerHTML = await renderClientHistory(histories)
    const items = Object.values(parent.children);
    lengthView.textContent = `הצג הכל (${histories.length})`
    if (items[0].className.includes("empty"))return
    items.forEach(el => enableSwipeRight(el, showClienthistoryAction, hideClienthistoryAction));
}

function showClienthistoryAction(element){
    const parent = element.closest(".client-report-event");
    if (!parent) return;
    const action = parent.querySelector(".client-report-event-action");
    if (!action) return;
    parent.parentElement.querySelectorAll(".client-report-event-action").forEach(item => {
        if (item !== action) item.classList.remove("show");
    });
    action.classList.add("show");
}

function hideClienthistoryAction(element){
    const parent = element.closest(".client-report-event");
    if (!parent) return;
    const action = parent.querySelector(".client-report-event-action");
    if (!action) return;
    action.classList.remove("show");
}


async function reloadClientSummaryReport(t){
    delete c_runtime.clientsReports[c_runtime.currentClientIdView]
    await renderClientSummaryReport()
}


function deleteClientHistory(historyId){
    const data = {action:ApiCall.history_delete, hid:historyId}
    const toast = showToast("מוחק..")
    apiPost(ApiRoute.api, data).then(
        (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast)
                return;
            }
            const nhis = c_runtime.clientsReports[c_runtime.currentClientIdView].history.filter(h=>h.history_id != historyId)
            c_runtime.clientsReports[c_runtime.currentClientIdView].history = nhis;
            createClientHistory()
            showToast(res.notice, ToastStat.DONE, toast)
        }

    )
}

async function restoreClientHistoryAction(historyId){
    const ask = await showAsk({title:'שחזור שינויים', msg:"להמשיך?"})
    if (!ask)return
    const data = {action:ApiCall.history_restore, hid:historyId}
    const toast = showToast("מאחזר..")
    apiPost(ApiRoute.api, data).then(
        (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast)
                return;
            }
            const nhis = c_runtime.clientsReports[c_runtime.currentClientIdView].history.filter(h=>h.history_id != historyId)
            c_runtime.clientsReports[c_runtime.currentClientIdView].history = nhis;
            createClientHistory()
            showToast(res.notice, ToastStat.DONE, toast)
            
        }
    )
}

function showInfoClientHistory(historyId){

}

function showClientActivityExpand(){
    const addExpand = (el)=>{el.classList.add("expand")}
    const parent = document.getElementById("listClientActivity");
    const profile = document.getElementsByClassName("client-report-profile")?.[0];
    const gridData = document.getElementsByClassName("client-report-grid")?.[0];
    const showAllActivity = document.getElementById("showAllActivity");
    const parentSearchClientActivity = document.getElementById("parentSearchClientActivity");
    const head = document.getElementsByClassName("client-report-section-head")?.[0];
    const crshMenu = document.getElementById("crshMenu");
    profile?.classList.add("hide");
    gridData?.classList.add("hide");
    showAllActivity.classList.add("hide")
    parentSearchClientActivity.classList.add("show")
    addExpand(parent);
    addExpand(head)
    addExpand(crshMenu)
    c_reports.clientActivityViewShort = false
    createClientHistory()
}

function hideClientActivityExpand(){
    const delExpand = (el)=>{el.classList.remove("expand")}
    const parent = document.getElementById("listClientActivity");
    const profile = document.getElementsByClassName("client-report-profile")?.[0];
    const gridData = document.getElementsByClassName("client-report-grid")?.[0];
    const head = document.getElementsByClassName("client-report-section-head")?.[0];
    const showAllActivity = document.getElementById("showAllActivity");
    const parentSearchClientActivity = document.getElementById("parentSearchClientActivity");
    const crshMenu = document.getElementById("crshMenu");
    delExpand(parent)
    delExpand(head)
    delExpand(crshMenu)
    showAllActivity.classList.remove("hide")
    profile?.classList.remove("hide");
    gridData?.classList.remove("hide");
    parentSearchClientActivity.classList.remove("show")
    c_reports.clientActivityViewShort = true
    createClientHistory()
}


async function renderClientSummaryReport(){
    const parent = document.getElementById("client-reports");
    if (!parent){
        return;
    }
    if (!c_runtime.clientsReports[c_runtime.currentClientIdView]){
        await fetchClientReports(c_runtime.currentClientIdView);
    }
    else{
        return;
    }
    createBoxloading(parent)
    const data = c_runtime.clientsReports[c_runtime.currentClientIdView];
    const order = get_order_by_order_id(c_runtime.currentOrderIdView);
    if (!data){
        parent.innerHTML = `
            <div class="client-report-empty">
                <i class="fa-solid fa-chart-column"></i>
                <span>אין עדיין נתונים לדו"ח לקוח</span>
            </div>
        `;
        return;
    }

    const clientName = order.fullname || "-";
    const clientInitial = order.fullname ? order.fullname.charAt(0).toUpperCase() : "?";
    const countShared = getCountClientOrdersSharedToMarket(order.client_id)
    parent.innerHTML = `
        <div class="client-report">
            <div class="client-report-profile">
                <div class="client-report-profile-head">
                    <div class="client-report-map-bg" id="clientReportProfileMap"></div>
                    <div>
                        <div class="avatar client-report-avatar">${reportEscapeHtml(clientInitial)}</div>
                        <div class="client-report-title">
                            <strong>${reportEscapeHtml(clientName)}</strong>
                        </div>
                    </div>
                    <div class="crt-info">
                        <small>${reportEscapeHtml(order.phone || "")}</small>
                        <i class="fa-solid fa-phone"></i>
                    </div>
                </div>
                <div class="client-report-total">
                    <div>
                        <span>סך הכנסות אחרי הוצאות</span>
                        <div>
                            <span class="rtf-number" id="fundsTotalIncome">${reportMoney(data.income)}</span>
                            <span class="rtf-shekel-icon">₪</span>
                        </div>
                    </div>
                    <div>
                        <i class="fa-solid fa-arrows-rotate btn-r-show-calendar" onclick="reloadClientSummaryReport(this)"></i>
                    </div>
                </div>
            </div>

            <div class="client-report-grid">
                <div class="client-report-stat">
                    <div>
                        <span>כסף ברוטו</span>
                        <strong class='income'>${reportMoney(data.funds)}+</strong>
                    </div>
                    <i class='icon icon-24'>${await icon("money")}</i>
                </div>
                <div class="client-report-stat">
                    <div>
                        <span>יתרה פתוחה</span>
                        <h4 class='income'>${reportMoney(data.balance)}+</h4>
                    </div>
                    <i class='icon icon-24'>${await icon("money-receive")}</i>
                </div>
                <div class="client-report-stat">
                    <div>
                        <span>ממוצע להזמנה</span>
                        <h4 class='income'>${reportMoney(data.ave_income)}+</h4>
                    </div>
                    <i class='icon icon-24'>${await icon("graph-color")}</i>
                </div>
                <div class="client-report-stat">
                    <div>
                        <span>הנחות</span>
                        <h4 class='expense'>${reportMoney(data.off_price)}-</h4>
                    </div>
                    <i class='icon icon-24'>${await icon("discount")}</i>
                </div>
                <div class="client-report-stat">
                    <div>
                        <span>הוצאות</span>
                        <h4 class='expense'>${reportMoney(data.expenses)}-</h4>
                    </div>
                    <i class='icon icon-24'>${await icon("expense")}</i>
                </div>
                <div class="client-report-stat">
                    <div>
                        <span>הזמנות</span>
                        <strong class=''>${data.orders_count}</strong>
                    </div>
                    <i class='icon icon-24'>${await icon("list")}</i>
                </div>
                <div class="client-report-stat">
                    <div>
                        <span>הזמנות משותפות</span>
                        <strong class=''>${countShared}</strong>
                    </div>
                    <i class='icon icon-24'>${await icon("globe-destination")}</i>
                </div>
                <div class="client-report-stat four">
                    <div class="crf-stat">
                        <span>השולמו</span>
                        <span>בהמתנה</span>
                        <span>לא נסגרו</span>
                        <span>ביטולים</span>
                    </div>
                    <div class="crf-stat">
                        <div class="crfsi">
                            <i class='icon icon-16'>${await icon("done")}</i>
                            <strong class=''>${data.done}</strong>
                        </div>
                        <div class="crfsi">
                            <i class='icon icon-16'>${await icon("closed")}</i>
                            <strong class=''>${data.closed}</strong>
                        </div>
                        <div class="crfsi">
                            <i class='icon icon-16'>${await icon("cancel")}</i>
                            <strong class=''>${data.wait}</strong>
                        </div>
                        <div class="crfsi">
                            <i class='icon icon-16'>${await icon("cancel")}</i>
                            <strong class=''>${data.cancel||0}</strong>
                        </div>  
                    </div>
                </div>
            </div>

            <div class="client-report-section" id="listClientActivity">
                <div class="client-report-section-head">
                    <div class="crsh-menu" id="crshMenu">
                        <span>פעילות</span>
                        <i class="fa-solid fa-xmark btn-r-show-calendar" onclick="hideClientActivityExpand()"></i>
                    </div>
                    <div class="client-report-activity tco-search" id="parentSearchClientActivity">
                        <i class="fa-solid fa-sliders"></i>
                        <input type="text" placeholder="סוג אירוע">
                    </div>
                    <div id="showAllActivity">
                        <small id="clientReportEventsListLength" onclick="showClientActivityExpand()">הצג הכל (${data.history.length})</small>
                        <i class="fa-solid fa-chevron-right fa-rotate-180"></i>
                    </div>
                    
                </div>
                <div class="client-report-events" id="clientReportEventsList">
                </div>
            </div>
        </div>
    `;
    createClientHistory()
    renderClientReportProfileMap(order);
}
