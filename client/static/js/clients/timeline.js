function showTimelineEmpty(){
    const parent = document.getElementById("scheduleContentEmpty")
    parent.classList.add("show")
}
function hideTimelineEmpty(){
    const parent = document.getElementById("scheduleContentEmpty")
    parent.classList.remove("show")
}
function showTimeline(){
    const parent = document.getElementById("scheduleCTimeline")
    parent.classList.add("show")
}
function hideTimeline(){
    const parent = document.getElementById("scheduleCTimeline")
    parent.classList.remove("show")
}

const c_timeline = {
    selectedWorkerId: getCurrentManagerId(),
    filterTimelineWorker:{},
    timelineOrders:{}
}

function getScheduleStatusName(stat){
    switch (stat) {
        case StateOrder.CANCELED:
            return 'cancel'
        case StateOrder.CLOSED:
            return 'current'
        case StateOrder.DONE:
            return "done"
    }
    return ''
}

function getScheduleIconStatus(order){
    const stat = order.stat;
    switch (stat) {
        case StateOrder.CANCELED:
            return 'cancel'
        case StateOrder.CLOSED:
            if (isClientDateOrderInRangeHour(order.date)){
                return "loading"
            }
            return "closed"
        case StateOrder.DONE:
            return "done"
    }   
}

function getOrderWorkerIds(order){
    let workers = order?.workers || [];
    if (!Array.isArray(workers)){
        return [];
    }
    return workers
}

function isTimelineOrderForWorker(day, order){
    return order.workers.includes(c_timeline.filterTimelineWorker[day])
}

function getTimelineOrders(force = false){
    if (Object.entries(c_timeline.timelineOrders).length && !force){return c_timeline.timelineOrders}
    
    const orders = Array.isArray(c_runtime.orders) ? c_runtime.orders : [];
    const now = new Date();
    const days = [];

    for (let i = 0; i <= 3; i++){
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i + 1);
        const from = start.getTime() / 1000;
        const to = end.getTime() / 1000;

        days.push({
            date: start,
            orders: orders
                .filter(order => {
                    const date = Number(order.date);
                    return date >= from && date < to ;
                })
                .sort((a, b) => Number(a.date || 0) - Number(b.date || 0))
        });
        c_timeline.filterTimelineWorker[i] = getCurrentManagerId();
    }
    c_timeline.timelineOrders = days

    return days;
}

function getTimelineDateTitle(date){
    return date.toLocaleDateString("he-IL", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function getTimelineSelectedWorkerName(day){
    const workerId = c_timeline.filterTimelineWorker[day];
    const worker = getWorkerByWorkerId(workerId)
    return worker?.username||"-";
}

function switchTimelineWorkerFilters(day){
    switchFilterOptions("mf-wtl"+day)
}

function createTimelineWorkerFilter(day){
    const filter = document.createElement("div");
    filter.className = "filter-item";

    const selected = document.createElement("span");
    selected.className = "viewFilterSelected";
    selected.textContent = getTimelineSelectedWorkerName(day);
    selected.onclick = (e) => {
        switchTimelineWorkerFilters(day)
    }

    const options = document.createElement("div");
    options.className = "filter-options";
    options.id = "mf-wtl"+day

    const addOption = (workerId, day, text, iconClass) => {
        const option = document.createElement("div");
        const iconEl = document.createElement("i");
        const textEl = document.createElement("span");

        option.className = "filter-option";
        option.dataset.wid = workerId;
        option.dataset.day = day
        iconEl.className = iconClass;
        textEl.textContent = text;
        option.append(iconEl, textEl);
        option.onclick = (e, wid=workerId, d=day) => {
            e.stopPropagation();
            c_timeline.filterTimelineWorker[d] = wid;
            textEl.textContent = getTimelineSelectedWorkerName(d);
            renderTimeLine(d);
        }
        options.appendChild(option);
    }

    const workers = Array.isArray(c_runtime.workers) ? c_runtime.workers : [];
    workers.forEach(worker => {
        addOption(worker.employee_id, day, worker.username, "fa-solid fa-user");
    });

    filter.append(selected, options);
    return filter;
}


function createTimelineWorkerFilterControl(day){
    return createTimelineWorkerFilter(day);
}

function createTimelineEmptyDay(){
    const empty = document.createElement("div");
    empty.className = "schedule-day-empty";
    empty.innerHTML = `
        <i class="fa-solid fa-calendar-day"></i>
        <span>אין הזמנות ביום הזה</span>
    `;
    return empty;
}

async function createTimelineDaySection(day, ordersDay){
    const section = document.createElement("section");
    section.className = "schedule-day-section";
    section.id = 'scheduleDaySection'+day

    const separator = document.createElement("div");
    separator.className = "schedule-day-separator";

    const title = document.createElement("span");
    title.textContent = getTimelineDateTitle(ordersDay.date);
    
    separator.append(title, createTimelineWorkerFilterControl(day));

    const list = document.createElement("div");
    list.className = "schedule-day-list";

    if (!ordersDay.orders.length){
        list.appendChild(createTimelineEmptyDay());
    }
    else{
        for (const order of ordersDay.orders){
            if (order.stat & StateOrder.WAIT)continue
            if (!order.workers.includes(c_timeline.filterTimelineWorker[day]))continue

            list.appendChild(await createScheduleCard(order));
        }
    }

    section.append(separator, list);
    return section;
}

function appendScheduleMeta(parent, iconClass, text){
    if (!text)return;

    const item = document.createElement("span");
    const iconEl = document.createElement("i");
    const textEl = document.createElement("span");

    iconEl.className = iconClass;
    textEl.textContent = text;
    item.append(iconEl, textEl);
    parent.appendChild(item);
}


function isClientDateOrderInRangeHour(date) {
    const now = Date.now();
    const start = new Date(date).getTime();
    const end = start + (60 * 60 * 1000); // +1 hour

    return now >= start && now <= end;
}


async function createScheduleCard(order) {
    // const title = document.createElement("span")
    // title.className = 'schedule-card-title'
    // title.textContent = getOrderStatText(order.stat)


    const wrapper = document.createElement("div");
    wrapper.className = "schedule-card-item";
    wrapper.dataset.orderId = order.order_id;

    const timeEl = document.createElement("div");
    timeEl.className = "schedule-time";
    timeEl.textContent = dateFloatToHour(order.date);

    const card = document.createElement("div");
    card.className = `schedule-card schedule-${getScheduleStatusName(order.stat)}`;

    const header = document.createElement("div");
    header.className = "schedule-card-header";

    const info = document.createElement("div");
    info.className = "sch-info";

    const name = document.createElement("span");
    name.className = "schedule-client-name";
    name.textContent = order.fullname;

    const meta = document.createElement("div");
    meta.className = "schedule-card-meta";
    appendScheduleMeta(meta, "fa-solid fa-phone", order.phone);
    appendScheduleMeta(meta, "fa-solid fa-location-dot", order.address);
    if (order.date_done != 0){
        appendScheduleMeta(meta, "fa-solid fa-clipboard-check", `הושלם ב-${dateFloatToHour(order.date_done)} ${dateFloatToYMD(order.date_done)}`)
    }

    info.append(name, meta);

    const _icon = document.createElement("i");
    _icon.className = "icon icon-32" + ((order.stat&StateOrder.CLOSED)&&isClientDateOrderInRangeHour(order.date)?" loading":"");
    
    _icon.innerHTML = await icon(getScheduleIconStatus(order));

    header.append(info, _icon);

    const money = document.createElement("div");
    money.className = "sch-money";

    const divPrice = document.createElement("div")
    const number = document.createElement("span");
    number.className = "shekel-number";
    number.textContent = order.price-order.off_price;

    const shekel = document.createElement("span");
    shekel.className = "shekel-icon";
    shekel.textContent = "₪";
    divPrice.append(number, shekel)

    const paidType = document.createElement("span");
    paidType.className = "payment-type";
    paidType.textContent = getPaymentStatText(order.payment_type);

    money.append(divPrice, paidType);

    // const client = document.createElement("div");
    // client.className = "schedule-client";
    // client.textContent = order.phone;

    card.append(header, money);
    wrapper.append(timeEl, card);

    return wrapper;
}

async function renderTimeLine(specificDay = -1){
    const parent = document.getElementById("scsItems")
    const days = getTimelineOrders()
    hideTimelineEmpty()
    showTimeline()
    if (specificDay!=-1){
        const section = document.getElementById("scheduleDaySection"+specificDay)
        const newSection = await createTimelineDaySection(specificDay, days[specificDay])
        section.replaceWith(newSection)
        switchFilterOptions('mf-wtl'+specificDay)
    }else{
        parent.replaceChildren()
        for (const [index, day] of days.entries()){
            parent.appendChild(await createTimelineDaySection(index, day))
            switchFilterOptions('mf-wtl'+index)
        }
    }
    if (specificDay==-1){
        parent.scrollTo({left: parent.scrollWidth, behavior: "smooth"})
    }
}

async function updateScheduleOrder(order){
    if (configClients.currentView != clientsView.TIMELINE)return;

    const days = getTimelineOrders();
    const orderDate = Number(order.date || 0);
    const dayIndex = days.findIndex(day => {
        const start = new Date(day.date);
        const end = new Date(day.date);
        start.setHours(0, 0, 0, 0);
        end.setHours(24, 0, 0, 0);
        return orderDate >= start.getTime()/1000 && orderDate < end.getTime()/1000;
    });
    if (dayIndex < 0)return;

    const section = document.getElementById("scheduleDaySection"+dayIndex);
    const list = section?.querySelector(".schedule-day-list");
    if (!list)return;

    const existing = Array.from(list.querySelectorAll(".schedule-card-item"))
        .find(item => item.dataset.orderId == order.order_id);
    const workerIds = getOrderWorkerIds(order);
    const shouldShow = !(order.stat & StateOrder.WAIT) &&
        workerIds.includes(c_timeline.filterTimelineWorker[dayIndex]);

    if (!shouldShow){
        existing?.remove();
        if (!list.querySelector(".schedule-card-item")){
            list.replaceChildren(createTimelineEmptyDay());
        }
        return;
    }

    const card = await createScheduleCard(order);
    if (existing){
        existing.replaceWith(card);
        return;
    }

    list.querySelector(".schedule-day-empty")?.remove();
    const nextCard = Array.from(list.querySelectorAll(".schedule-card-item"))
        .find(item => {
            const nextOrder = get_order_by_order_id(item.dataset.orderId);
            return nextOrder && Number(nextOrder.date || 0) > orderDate;
        });
    list.insertBefore(card, nextCard || null);
}

ClientStore.subscribe(change => {
    if (change.entityType != "order" || !change.changedFields.includes("stat"))return;
    updateScheduleOrder(change.entity).catch(error => console.error("Timeline update failed", error));
});
