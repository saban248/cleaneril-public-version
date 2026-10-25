let IS_MOBILE = window.matchMedia("(max-width: 768px)").matches;



function getIconByStatToast(stat){
    switch (stat){
        case ToastStat.DONE:
            return `fa-solid fa-circle-check tc-icon tci-${stat}`
        case ToastStat.LOAD:
            return `fa-solid fa-circle-notch fa-spin tc-icon tci-${stat}`;
        case ToastStat.ERROR:
            return `fa-solid fa-triangle-exclamation tc-icon tci-${stat}`
        case ToastStat.INFO:
            return 'fa-solid fa-circle-info';
    }

    return ''
}

function showToast(text, stat = ToastStat.LOAD, id=null, deleteToast = true){
    let toast = null;
    let icon = null;
    let head = null;
    let body = null;
    const __id = id || generateHex(4);
    if (!id){
        toast = document.createElement("div");
        toast.id = __id;
        toast.onclick = ()=>{
            toast.remove();
        }
        head = document.createElement("div")
        head.id = __id+'head';
        body = document.createElement("div")
        body.id = __id+'body'
        icon = document.createElement("i");
        icon.id = __id+'icon'
        toast.className = "toast";
        head.className = 'tc-head';
        body.className = 'tc-body';

        toast.appendChild(head);
        toast.appendChild(body)
        head.appendChild(icon)
        const container = document.getElementById("toast-container");
        if (container) container.appendChild(toast);

    }else{
        toast = document.getElementById(id)
        if (!toast){
            return showToast(text, stat);
        }
        body = document.getElementById(id+'body');
        icon = document.getElementById(id+'icon')
    }

    if (icon) icon.className = getIconByStatToast(stat);
    if (body) body.innerText = text;

    deleteToast&&setTimeout(()=>{toast?.click()}, 6000);
    return __id;
}
function closeToast(id){
    document.getElementById(id)?.remove();
}
function isDateExpired(date){
    return Number.isFinite(date) && date < Date.now();

}
function getRelativeDate(date) {
    const target = new Date(date);
    const now = new Date();

    let diff = target.getTime() - now.getTime();
    const future = diff > 0;

    diff = Math.abs(diff);

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const remainingMinutes = minutes % 60;
    const remainingHours = hours % 24;

    const prefix = future ? "בעוד" : "לפני";

    if (minutes < 1) {
        return "ממש עכשיו";
    }

    if (minutes === 1) {
        return `${prefix} דקה`;
    }

    if (minutes < 60) {
        return `${prefix} ${minutes} דקות`;
    }

    if (hours === 1) {
        return remainingMinutes
            ? `${prefix} שעה ו-${remainingMinutes} דקות`
            : `${prefix} שעה`;
    }

    if (hours < 24) {
        return remainingMinutes
            ? `${prefix} ${hours} שעות ו-${remainingMinutes} דקות`
            : `${prefix} ${hours} שעות`;
    }

    if (days === 1) {
        return remainingHours
            ? `${prefix} יום ו-${remainingHours} שעות`
            : `${prefix} יום`;
    }

    if (days < 30) {
        return remainingHours
            ? `${prefix} ${days} ימים ו-${remainingHours} שעות`
            : `${prefix} ${days} ימים`;
    }

    const months = Math.floor(days / 30);
    const remainingDays = days % 30;

    if (months === 1) {
        return remainingDays
            ? `${prefix} חודש ו-${remainingDays} ימים`
            : `${prefix} חודש`;
    }

    if (months < 12) {
        return remainingDays
            ? `${prefix} ${months} חודשים ו-${remainingDays} ימים`
            : `${prefix} ${months} חודשים`;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 1) {
        return remainingMonths
            ? `${prefix} שנה ו-${remainingMonths} חודשים`
            : `${prefix} שנה`;
    }

    return remainingMonths
        ? `${prefix} ${years} שנים ו-${remainingMonths} חודשים`
        : `${prefix} ${years} שנים`;
}



function getMoneyValueFormat(value) {
    if (value < 1000) {
        return value.toString();
    }

    if (value < 1000000) {
        return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
    }

    if (value < 1000000000) {
        return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
    }

    return `${(value / 1000000000).toFixed(value % 1000000000 === 0 ? 0 : 1)}B`;
}


async function apiRequest(method, url, body = null) {
    const options = {
        method: method,
        headers: {},
        credentials: 'same-origin'
    };

    // If body is FormData (file upload), let fetch set the correct headers
    if (body instanceof FormData) {
        options.body = body;
    } else if (body !== null && body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);

        // try to parse JSON body if present
        let parsed = null;
        try {
            parsed = await response.json();
        } catch (e) {
            // no JSON body
            parsed = null;
        }

        if (!response.ok) {
            // return server-provided JSON error when available, otherwise a normalized error
            if (parsed && typeof parsed === 'object') return parsed;
            return { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        return parsed;
    } catch (err) {
        console.error('API Error:', err);
        return { error: err.message };
    }
}


async function apiGet(url) {
    return await apiRequest("GET", url);
}


async function apiPost(url, data) {
    return await apiRequest("POST", url, data);
}


function generateHex(len = 16) {
    let result = "";
    const chars = "0123456789abcdef";

    for (let i = 0; i < len; i++) {
        result += chars[Math.floor(Math.random() * 16)];
    }
    return result;
}



function rectMenu(menu, btn, menur){
    let top = btn.bottom + 6;
    let left = btn.left;

    // אם אין מקום למטה → תעלה למעלה
    if (btn.bottom + menur.height > window.innerHeight) {
        top = btn.top - menur.height - 6;
    }

    // אם יוצא ימינה → תיישר שמאלה
    if (btn.left + menur.width > window.innerWidth) {
        left = window.innerWidth - menur.width - 10;
    }

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;

}

async function geocodeAddressOSM(address) {
    const coordinates = {
        specific: [32.18, 34.87],
        area: [32.18, 34.87],
        areaName: "Israel"
    };

    const url =
        `https://nominatim.openstreetmap.org/search?format=json` +
        `&addressdetails=1&q=${encodeURIComponent(address)}&limit=1`;

    const resp = await fetch(url);
    const data = await resp.json();

    console.log(data);

    if (!data.length) {
        return coordinates;
    }

    const result = data[0];
    const addr = result.address || {};

    coordinates.specific = [
        parseFloat(result.lat),
        parseFloat(result.lon)
    ];

    const areaName =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        null;

    if (!areaName) {
        return coordinates;
    }

    const areaUrl =
        `https://nominatim.openstreetmap.org/search?format=json` +
        `&q=${encodeURIComponent(areaName + ", Israel")}&limit=1`;

    const areaResp = await fetch(areaUrl);
    const areaData = await areaResp.json();

    if (areaData.length) {
        coordinates.area = [
            parseFloat(areaData[0].lat),
            parseFloat(areaData[0].lon)
        ];
    }

    coordinates.areaName = areaName;

    return coordinates;
}

function dateFloatToYMD(ts){
    const date = new Date(ts * 1000);
    const formatted = date.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
    });

    return formatted
}

function dateFloatToHour(ts){
    if (ts > 1e12) {
        ts = ts / 1000;
    }

    const date = new Date(ts * 1000);

    return date.toLocaleTimeString('he-IL', {
        timeZone: 'Asia/Jerusalem',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function dateFloatToYMDNDH(ts){
    // Year, Month, Day, Name Day, Hour:minute
    return `${dateFloatToHour(ts)}, ${new Date(ts*1000).toLocaleDateString("he-IL", { weekday: "long" })} ${dateFloatToYMD(ts)}`
}

function cleanPhoneJustNumbers(phone) {
  if (!phone) return '';

  phone = String(phone).replace(/[\u200E\u200F\u202A-\u202E]/g, '');
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('9720')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('972')) {
    digits = '0' + digits.slice(3);
  }

  return digits;
}

function isValidPhone(phone){
    return /^(05\d{8}|0[2-9]\d{7})$/.test(phone)
}

function isValidIsraeliID(id) {
    if (!/^\d+$/.test(id)) return false;

    id = id.padStart(9, '0'); // השלמה ל-9 ספרות

    let sum = 0;

    for (let i = 0; i < 9; i++) {
        let num = Number(id[i]) * ((i % 2) + 1);

        if (num > 9) num -= 9;

        sum += num;
    }

    return sum % 10 === 0;
}

function matchNumsWords(nums, str1, str2) {
  const words1 = (str1 || '').toLowerCase().split(/\s+/);
  const words2 = (str2 || '').toLowerCase().split(/\s+/);

  let count = 0;

  for (const w of words1) {
    if (words2.includes(w)) {
      count++;
      if (count >= nums) return true;
    }
  }

  return false;
}

/** model */
const modal = document.getElementById("confirmModal");
const titleEl = document.getElementById("modalTitle");
const messageEl = document.getElementById("modalMessage");
const btnConfirm = document.getElementById("btnConfirm");
const btnCancel = document.getElementById("btnCancel");

function showAsk({ title, msg, cbConfirm, cbCancel }) {
    if (titleEl) titleEl.textContent = title || (typeof msg !== 'undefined' ? msg : '');
    if (messageEl) messageEl.textContent = msg;

    if (modal) modal.classList.remove("hide");
    if (cbConfirm) btnConfirm.onclick = () => { cbConfirm(); closeAsk(true); };
    if (cbCancel) btnCancel.onclick = () => { cbCancel(); closeAsk(false); };
    return new Promise((resolve) => {
        if (modal) {
            modal.__ask_resolver = resolve;
        } else {
            // fallback when modal element is not present yet
            window.__ask_resolver = resolve;
        }
    });
}

function closeAsk(code = false) {
    if (modal) modal.classList.add("hide");
    const resolver = modal ? modal.__ask_resolver : window.__ask_resolver;
    if (resolver) {
        resolver(code);
        if (modal) delete modal.__ask_resolver;
        else delete window.__ask_resolver;
    }
}

document.addEventListener("DOMContentLoaded", async function (){
    if (btnCancel && btnConfirm){
        btnCancel.onclick = () => {closeAsk(false)};
        btnConfirm.onclick = () => {closeAsk(true)};
    }

    // ESC + click outside
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAsk(false);
    });

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeAsk(false);
        });
    }

    window.addEventListener("resize", () => {
        IS_MOBILE = window.matchMedia("(max-width: 768px)").matches;
    });

})


// GENERAL SEARCH

function closeSearchInput(id, t){
    const input = document.getElementById(id);
    if (!input || !t) return;
    input.classList.remove("show");
    const parent = t.parentElement;
    if (parent && parent.children.length >= 2) {
        const [ix, io] = [parent.children[0], parent.children[1]];
        if (ix) ix.classList.remove("show")
        if (io) io.classList.add("show")
    }

    input.value = '';
}
function openSearchInput(id, t){
    const input = document.getElementById(id);
    if (!input || !t) return;
    input.classList.add("show");
    const parent = t.parentElement;
    if (parent && parent.children.length >= 2) {
        const [ix, io] = [parent.children[0], parent.children[1]];
        if (ix) ix.classList.add("show")
        if (io) io.classList.remove("show")
    }
}



function _0C0A0ON_(){
const url="https://wa.me/972"+[39, 34, 47, 34, 39, 39, 34, 33, 38, 32].map(n=>String.fromCharCode(n^'()')).join("").slice(1);
window.open(url,"_blank");
}

function onApiCall(t, done = false){
    const icon = t.children[1]
    if (done){
        icon.style.display = 'none'
        t.children[0].style.display = 'block';
        t.disabled = false;
    }
    else{
        icon.style.display = 'block';
        t.children[0].style.display = 'none';
        t.disabled = true;
    }
    
}



async function icon(name) {
    return await fetch(`/icons/${name}.svg`).then(r => r.text());
}


function createBoxloading(container){
    container.innerHTML = `<div class="box-loading"></div>`
}


function createCountdown(element, seconds) {
    const span = document.createElement("span");
    element.appendChild(span);

    let remaining = seconds;
    function update() {
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;

        span.textContent = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        if (remaining <= 0) {
            clearInterval(timer);
            return;
        }

        remaining--;
    }

    update();
    const timer = setInterval(update, 1000);

    return span;
}


const swipeRightConfig = {
    swiping:false,
    startX:0,
    currentX:0,
    transition:'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
    transformEnd:'translateX(0)',
    transformStart:'translateX(50%)'
}
function closeSwipeRight(){
    swipeRightConfig.swiping = false;
    swipeRightConfig.currentX = 0
}


function enableSwipeRight(element, onSwipe = null, onClose = null, threshold = 100) {
    const isActionMenuTarget = (target) => {
        if (!target || !target.closest) return false;
        return target.closest(".client-report-event-action") !== null;
    };

    element.addEventListener("pointerdown", e => {
        if (isActionMenuTarget(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        document.querySelectorAll(`.${element.classList[0]}.swiping`).forEach(el => {
            if (el !== element) {
                el.classList.remove("swiping");
                el.style.transition = "transform 300ms ease";
                el.style.transform = "translateX(0)";
            }
        });
        swipeRightConfig.startX = e.clientX;
        swipeRightConfig.currentX = 0;
        swipeRightConfig.swiping = true;
        element.classList.add("swiping");
        element.style.transition = "none";
        element.setPointerCapture(e.pointerId);
    });

    element.addEventListener("pointermove", e => {
        const isAction = isActionMenuTarget(e.target)
        if (!swipeRightConfig.swiping || isAction) {
            if (isAction) {
                e.preventDefault();
                e.stopPropagation();
            }
            return;
        }

        swipeRightConfig.currentX = e.clientX - swipeRightConfig.startX;

        if (swipeRightConfig.currentX > 0)
            element.style.transform = `translateX(${swipeRightConfig.currentX}px)`;
    });

    element.addEventListener("pointerup", e => {
        if (isActionMenuTarget(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        if (!swipeRightConfig.swiping) return;

        swipeRightConfig.swiping = false;
        element.style.transition = swipeRightConfig.transition

        if (swipeRightConfig.currentX >= threshold) {
            element.style.transform = swipeRightConfig.transformStart;
            onSwipe?.(element);
        } else {
            element.style.transform = swipeRightConfig.transformEnd;
            onClose?.(element);
        }

        swipeRightConfig.currentX = 0;
    });

    element.addEventListener("click", e => {
        if (isActionMenuTarget(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    });     

    element.addEventListener("pointercancel", () => {
        swipeRightConfig.swiping = false;
        swipeRightConfig.currentX = 0;
        element.style.transition = "transform 300ms ease";
        element.style.transform = swipeRightConfig.transformEnd;
    });
}



function limitWords(text, maxWords = 20) {
    if (!text) return "";

    const words = text.trim().split(/\s+/);

    if (words.length <= maxWords)
        return text;

    return words.slice(0, maxWords).join(" ") + "...";
}