
const reportsCalendar = {
    sFrom:null,
    sTo:null,
    sMode:0,
    dateMaximum:false,
    dateYear:false,
    dateCurrent:new Date()
}
const reportsTabs  = {
    FUNDS:1<<0,
    ORDERS:1<<1
}
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


function showCalendarReports(){
    renderCalendar()
    const calendar = document.getElementById("reportsCalendar")
    calendar.classList.add("show")
}

function hideCalendarReports(){
    const calendar = document.getElementById("reportsCalendar")
    calendar.classList.remove("show")
}
function renderCalendar() {
    const year = reportsCalendar.dateCurrent.getFullYear();
    const month = reportsCalendar.dateCurrent.getMonth();
    
    document.getElementById('calendaerMonthTitle').textContent = monthNames[month];
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();
    
    let calendarHTML = '';
    
    // Day headers
    dayNames.forEach(day => {
        calendarHTML += `<div class="day-header">${day}</div>`;
    });
    
    //  month days
    for (let i = firstDayWeek - 1; i >= 0; i--) {
        calendarHTML += `<div class="day other-month">${prevLastDate - i}</div>`;
    }
    
    //  c.month days
    const today = new Date();
    for (let day = 1; day <= lastDate; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = (reportsCalendar.sFrom && date.toDateString() === reportsCalendar.sFrom.toDateString()) ||
                            (reportsCalendar.sTo && date.toDateString() === reportsCalendar.sTo.toDateString());
        const isInRange = reportsCalendar.sFrom && reportsCalendar.sTo && date > reportsCalendar.sFrom && date < reportsCalendar.sTo;
        const isRangeStart = reportsCalendar.sFrom && date.toDateString() === reportsCalendar.sFrom.toDateString();
        const isRangeEnd = reportsCalendar.sTo && date.toDateString() === reportsCalendar.sTo.toDateString();
        
        let classes = 'day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (isInRange) classes += ' in-range';
        if (isRangeStart) classes += ' range-start';
        if (isRangeEnd) classes += ' range-end';
        
        calendarHTML += `<div class="${classes}" onclick="selectDate(${year}, ${month}, ${day})">${day}</div>`;
    }
    
    // Next month days
    const remainingDays = 42 - (firstDayWeek + lastDate);
    for (let i = 1; i <= remainingDays; i++) {
        calendarHTML += `<div class="day other-month">${i}</div>`;
    }
    
    document.getElementById('reports-calendar').innerHTML = calendarHTML;
}

function selectDate(year, month, day) {
    const date = new Date(year, month, day);    
    if (reportsCalendar.sMode === 0 || !reportsCalendar.sFrom) {
        reportsCalendar.sFrom = date;
        reportsCalendar.sTo = null;
        reportsCalendar.sMode = 1;
    } else if (reportsCalendar.sMode === 1) {
        if (date < reportsCalendar.sFrom) {
            reportsCalendar.sTo = reportsCalendar.sFrom;
            reportsCalendar.sFrom = date;
        } else {
            reportsCalendar.sTo = date;
        }
        reportsCalendar.sMode = 0;
    }
    
    updateDateDisplay();
    renderCalendar();
}

function updateDateDisplay() {
    const fromElement = document.getElementById('fromDate');
    const toElement = document.getElementById('toDate');
    const viewCalendarDate = document.getElementById("calendarDateview")
    
    if (reportsCalendar.sFrom) {
        fromElement.textContent = formatDate(reportsCalendar.sFrom);
    } else {
        fromElement.textContent = 'לא הוגדר';
    }
    
    if (reportsCalendar.sTo) {
        toElement.textContent = formatDate(reportsCalendar.sTo);
    } else {
        toElement.textContent = 'לא הוגדר';
    }
    if (!reportsCalendar.dateMaximum){
        viewCalendarDate.textContent = formatDate(reportsCalendar.sTo) + ' ל '+formatDate(reportsCalendar.sFrom)
    }
    else{
        viewCalendarDate.textContent = 'תמיד'
    }
}

function formatDate(date) {
    if (!date)return
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function changeMonth(delta) {
    reportsCalendar.dateCurrent.setMonth(reportsCalendar.dateCurrent.getMonth() + delta);
    renderCalendar();
}

function goToMonth(year, month) {
    const now = new Date();

    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth(); // 0–11

    reportsCalendar.sFrom = new Date(y, m, 1);
    reportsCalendar.sTo   = new Date(y, m + 1, 0, 23, 59, 59, 999);
    updateDateDisplay()
    renderCalendar()
}

function goToYear(year) {
    reportsCalendar.dateMaximum = false
    reportsCalendar.dateYear = true
    const now = new Date();
    const y = year || now.getFullYear();
    reportsCalendar.sFrom = new Date(y, 0, 1);
    reportsCalendar.sTo   = new Date(y, 11, 31, 23, 59, 59, 999);
    updateDateDisplay()
    renderCalendar()

}

function goToMaximum(){
    reportsCalendar.dateMaximum = true;
    reportsCalendar.dateYear = false
    reportsCalendar.sFrom = new Date(0)
    reportsCalendar.sTo = new Date()
    updateDateDisplay()
    renderCalendar()

}


async function applyDates() {
    if (reportsCalendar.sFrom && reportsCalendar.sTo) {
        const days = Math.ceil((reportsCalendar.sTo - reportsCalendar.sFrom) / (1000 * 60 * 60 * 24));
        hideCalendarReports()
    } else {
        showToast("בחר התחלה וסיום", ToastStat.ERROR)
        return
    }
    await reloadReports()

}

async function animateCounter(el, target, icon, duration = 1000) {
    let start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);

        const value = Math.floor(progress * (target - start) + start);
        el.textContent = value.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
        if (progress == 1){
            el.textContent = icon + el.textContent
        }
    }
    requestAnimationFrame(update);
}


function updateUI(id, value, icon = '₪') {
    const el = document.getElementById(id);
    el.innerText = formatNumber(value) + ` ${icon}`;
    animateCounter(el, value, icon)
}

async function reloadReports(){
    const currentYear = new Date().getFullYear();
    await fetchFundsAndOrdersReports();
    await selectYearReportsChart(currentYear)
}

async function fetchGraphReports(rAction, year, callback){
    const data = {
        action:ApiCall.api_reports,
        rAction:rAction,
        year:year
    }
    return await new Promise((reslove) => apiPost(ApiRoute.api, data).then(
        (res) => {
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR);
            }else if (callback){
                callback(res)
            }
            reslove(res)
        }
    ))
}


async function fetchGraphOrders(y){
    const callback_success = (res) =>{
        const {monthlyItems, monthlyCanceled, monthlyOrders, monthlyACR} = prepareMonthlyDataGraphOrders(res.graph_orders, y);
        chartOrdersUpdateSeries(monthlyItems, monthlyCanceled, monthlyOrders, monthlyACR)
    }
    await fetchGraphReports(ReportsApi.graph_orders, y, callback_success)
}
async function fetchGraphFunds(y) {
    const callback_success = (res) =>{
        const {monthlyIncome, monthlyExpenses, monthlyAIPCM, monthlyAEPCM} = prepareMonthlyDataGraphFunds(res.graph_funds, y);
        chartFundsUpdateSeries(monthlyIncome, monthlyExpenses, monthlyAIPCM, monthlyAEPCM)
    }
    await fetchGraphReports(ReportsApi.graph_funds, y, callback_success)
}




async function fetchFundsAndOrdersReports(){
    const fti = "fundsTotalIncome";
    const fi = "fundsIncome";
    const fe = "fundsExpense";
    const fppc = "fundsPPC";
    const fepc = "fundsEPC";
    const oic = "ordersItemsCount";
    const on = 'ordersNumber';
    const or = 'ordersRepeat';
    const oc = 'ordersCanceled';
    const currentYear = reportsCalendar.sFrom ? reportsCalendar.sFrom.getFullYear() : new Date().getFullYear();
    const data = {action:ApiCall.api_reports,rAction:ReportsApi.funds,
        year:currentYear, df:reportsCalendar.sFrom.getTime()/1000,
        dt:reportsCalendar.sTo.getTime()/1000
    }
    return await new Promise((reslove) => apiPost(ApiRoute.api, data).then(
        (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR);
                reslove(res);
                return;
            }            
            updateUI(fti, res.ie, '')
            updateUI(fe, res.e)
            updateUI(fi, res.i)
            updateUI(fppc, res.aio)
            updateUI(fepc, res.aeo)
            updateUI(oic, res.cico, '')
            updateUI(on, res.cod, '')
            updateUI(or, res.ccr, '')
            updateUI(oc, res.occ, '')
            reslove(res);
        }
    ))
}


function switchReportsTab(tab){
    const funds = document.getElementById("reportsFunds");
    const orders = document.getElementById("reportsOrders")
    const chartFunds = document.getElementById("chartReportsFunds")
    const chartOrders = document.getElementById("chartReportsOrders");
    switch (tab){
        case reportsTabs.FUNDS:
            funds.classList.add("show")
            orders.classList.remove("show")
            chartFunds.classList.add("show");
            chartOrders.classList.remove("show")
            break
        case reportsTabs.ORDERS:
            orders.classList.add("show")
            funds.classList.remove("show")
            chartFunds.classList.remove("show");
            chartOrders.classList.add("show")
            break
    }
    window.dispatchEvent(new Event('resize'));
}


document.addEventListener("DOMContentLoaded", function () {
    initChartsFunds()
    initChartsOrders()
    goToMonth()
    renderCalendar();
    updateDateDisplay();
    reloadReports()
    switchReportsTab(reportsTabs.FUNDS)

    document.addEventListener("click", e => {
    const calendar = document.getElementById("reportsCalendar")
    if (!calendar.contains(e.target) && !e.target.closest(".calendar-container") && !e.target.classList.contains("btn-r-show-calendar")&& !e.target.closest(".day")) {
        hideCalendarReports()
    }})

    const tabs = document.querySelectorAll(".reports-tab");
    tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelector(".reports-tab.selected")?.classList.remove("selected");
        tab.classList.add("selected");

    })});


}
)
