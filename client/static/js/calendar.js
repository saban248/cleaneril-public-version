
/** @type {Object.<string, Object>} */
var calendarCacheOrders = {}; // Flat cache indexed by order key
var mapClients = null;
/** @type {object[]} */
var markersClients = {}
var markerLayer = null;
var calendar = null;
let selectS = null
let selectE = null


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getOrdersCalendar(){
    const [start, end] = getCalendarRange();

    return Object.values(calendarCacheOrders).filter(c => isOrderVisibleInCalendar(c, start, end));
}

function getCalendarRange(){
    let s = document.getElementById("calendar-from").dataset.s;
    let e = document.getElementById("calendar-to").dataset.e;
    let start, end;
    if (!s||!e){
        [start, end] = getCurrentMonthRange();
    }
    else{
        start = new Date(s);
        end = new Date(e);
    }

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    return [start, end];
}

function isOrderVisibleInCalendar(order, start, end){
    const date = new Date(order.date * 1000);
    return Boolean(order.stat & c_runtime.state_calendar_selected) && date >= start && date < end;
}


function formatDateCalendar(d){
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const day = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${day}`
}

function getCurrentMonthRange(){
    const now = new Date()
    return getMonthRange(now)
}

function getMonthRange(date) {

    const year = date.getFullYear();
    const month = date.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    return [start, end ];
}


function getColorByStat(stat){
    switch (stat){
        case StateOrder.DONE:
            return "#046b09"
        case StateOrder.CLOSED:
            return "#e8d400"
        case StateOrder.CANCELED:
            return "#b7b7b7"
    }

    return "#ffffff"
}



function initialMapClients(){
    mapClients = L.map("map").setView([31.7100077,35.478982],8)
    markerLayer = L.layerGroup().addTo(mapClients)
    L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom:20
    }).addTo(mapClients)

    resetMarkersClients()
}

 
function resetMarkersClients(){
    markerLayer.clearLayers();
    markersClients = {}; // Clear cache to prevent stale references

    getOrdersCalendar().forEach(c=>{
        const coordinates = Array.isArray(c.coordinates) ? c.coordinates : JSON.parse(c.coordinates);
        if (!coordinates){return}
        const marker = L.marker(coordinates)
        .bindPopup(
                `
            <div class="order-popup">
                <div class="order-popup-header">
                    <div class="client-name">${c.fullname}</div>
                    <div class="client-date">
                        ${dateFloatToYMD(c.date)} | ${dateFloatToHour(c.date)}
                    </div>
                </div>

                <div class="order-popup-body">
                    <div>${c.address}</div>
                    <div>${c.price || 0}₪</div>
                </div>

                <div class="order-popup-actions">
                    <button onclick="openClientDashbaord('${c.client_id}', '${c.order_id}',true,true)">
                        פרטי ההזמנה
                    </button>
                </div>
            </div>
            `,
            {
                className: "custom-popup",
                closeButton: false,
                maxWidth: 200
            }
            ).addTo(markerLayer);
            

    markersClients[c.key] = marker
    })
    
    
}

function resetCalendarEvents(){
    // Remove existing client events while preserving UI-only events like 'selected-range'
    calendar.getEvents().forEach(event => {
        if (event.id !== 'selected-range') event.remove();
    });

    // Map and add individual events to ensure compatibility with selection highlights
    getOrdersCalendar().forEach(c => {
        calendar.addEvent({
            title: c.fullname,
            start: new Date(c.date * 1000), // FullCalendar requires a Date object, not seconds
            id: c.key,
            backgroundColor: getColorByStat(c.stat),
            borderColor: getColorByStat(c.stat)
        });
    });
}

function initialCalendarClients(initial = false){
    calendar = new FullCalendar.Calendar(
    document.getElementById("calendar"),
    {
        locale: "he",
        direction: "rtl",
        selectable:true,
        longPressDelay: 100,
        selectLongPressDelay: 100,
        select: function(info){
            updateFromTo(info.start, info.end)
            fetchClientsCalendar(); // This triggers onSelectRangeCalendar internally
            calendar.getEventById("selected-range")?.remove();
            calendar.addEvent({
                id: "selected-range",
                start: info.startStr,
                end: info.endStr,
                display: "background",
                backgroundColor: "#d8e8fc"
            })},

        initialView: "dayGridMonth",
        headerToolbar:{
            left: 'prev,next today',      
            center: 'title',   
            right: 'dayGridMonth,timeGridWeek,dayGridDay' 
        },
        buttonText: {
            today: 'היום',
            month: 'חודש',
            week: 'שבוע',
            day: 'יום'
        },
        datesSet: function(info){
            updateFromTo(info.start, info.end);
            fetchClientsCalendar();
        },
        dayMaxEvents: 2,
        events: getOrdersCalendar().map(c=>({
            title:c.fullname,
            start: new Date(c.date * 1000),
            id:c.key,
            backgroundColor:getColorByStat(c.stat),
            borderColor:getColorByStat(c.stat)
        })),

        eventClick: function(info){
            const id = info.event.id
            const marker = markersClients[id]
            if (marker==undefined)return
            mapClients.setView(marker.getLatLng(), 8) // Street level zoom
            marker.openPopup()

        }
    })

    calendar.render()
}

function updateFromTo(s, e){
    const dateFrom = document.getElementById("calendar-from")
    const dateTo = document.getElementById("calendar-to")
    const fs = formatDateCalendar(s)
    const fe = formatDateCalendar(e)
    
    // Calculate inclusive end for display purposes
    const displayEnd = new Date(e.getTime() - 1);
    const feDisplay = formatDateCalendar(displayEnd);

    dateFrom.dataset.s = fs
    dateTo.dataset.e = fe // Store exclusive end for logic
    dateFrom.textContent = fs.replace(/-/g, ".")
    dateTo.textContent = feDisplay.replace(/-/g, ".")
    selectS = s
    selectE = e
}

function onSelectRangeCalendar(){
    resetMarkersClients()
    resetCalendarEvents()
   
}

function selectCalendarState(t){
    updateMenuActionCalendarSorted(t, t.dataset.s)
    calendar.select(selectS, selectE)
    onSelectRangeCalendar()
}

function updateMenuActionCalendarSorted(t, state, cache = true){
    const cSelected = "sc-selected"
    if (!t.classList.contains(cSelected)&& (!(state&c_runtime.state_calendar_selected) || !cache)){
        t.classList.add(cSelected)
        c_runtime.state_calendar_selected |= state
    }
    else{
        t.classList.remove(cSelected)
        c_runtime.state_calendar_selected &= ~state
    }
}


async function fetchClientsCalendar(){
    const data = {
        action:ApiCall.calendar,
        df:selectS.getTime()/1000,
        dt:selectE.getTime()/1000
    }
    
    await apiPost(ApiRoute.api, data).then( res =>{
        if (!res.success) {
            showToast(res.notice, ToastStat.ERROR)
            return
        }
         // Merge new data into the flat cache
            res.data.forEach(order => {
                calendarCacheOrders[order.key] = order;
            });
    })
    onSelectRangeCalendar();
}

ClientStore.subscribe(change => {
    if (change.entityType != "order" || !change.changedFields.includes("stat"))return;

    const order = change.entity;
    const cached = calendarCacheOrders[order.key];
    if (!cached)return;
    cached.stat = order.stat;
    if (!calendar)return;

    const eventId = String(cached.key);
    const event = calendar.getEventById(eventId);
    const [start, end] = getCalendarRange();
    if (!isOrderVisibleInCalendar(cached, start, end)){
        event?.remove();
        return;
    }

    const color = getColorByStat(cached.stat);
    if (event){
        event.setProp("backgroundColor", color);
        event.setProp("borderColor", color);
        return;
    }

    calendar.addEvent({
        title:cached.fullname,
        start:new Date(cached.date * 1000),
        id:eventId,
        backgroundColor:color,
        borderColor:color
    });
});




document.addEventListener("DOMContentLoaded", function (){
    c_runtime.state_calendar_selected = StateOrder.DONE|StateOrder.CLOSED|StateOrder.CANCELED
    const [s,e] = getCurrentMonthRange()
    updateFromTo(s, e)
    initialMapClients()
    initialCalendarClients()
    calendar.select(s,e)
    fetchClientsCalendar()

    const observer = new ResizeObserver(()=>{

        mapClients?.invalidateSize()
        calendar?.updateSize()

    })

    observer.observe(document.querySelector(".dispatch-layout"))
})
