let liveShareJobLeafletMap = null;


function focusJobOnMap(jid){
    const job = c_market.getAJById(jid)
    if (!job || !liveShareJobLeafletMap){
        showToast(message.EneedRefresh, ToastStat.ERROR);
        return;
    }
    const coordinate = job.order.area_coordinate;
    liveShareJobLeafletMap.flyTo(coordinate, 11);
    liveShareJobLeafletMap.once("moveend", () => {
    L.popup({ maxWidth: 240 })
        .setLatLng(coordinate)
        .setContent(renderLiveMapShareJobPopup(job))
        .openOn(liveShareJobLeafletMap);
});
}

function renderLiveMapShareJobPopup(job){
    const jobType = getCleanOrderTypeText(job.job_type);
    const company = job.from_company_name;

    const areaName = job.order.area_name;
    const totalPrice = job.order.price-job.order.off_price;
    const fee = feeAnyTypeToMoney(totalPrice, job.fee, job.fee_type)
    const [text, icon] = getFeeTypeIconText(FeeTypes.CASH);

    return `
        <div class="live-map-popup" dir="rtl">
            <div class="live-map-popup-title">${jobType}</div>
            ${company ? `<div class="live-map-popup-line">${company}</div>` : ""}
            <div class="live-map-popup-line">${areaName}</div>
            ${`<div class="live-map-popup-price">${fee}${icon}</div>`}
        </div>
    `;
}

async function initLiveMapShareJob(){
    const parent = document.getElementById("liveTransactionsMap");
    if (liveShareJobLeafletMap){
        liveShareJobLeafletMap.remove();
        liveShareJobLeafletMap = null;
    }

    parent.innerHTML = `
        <div class="live-map-card" dir="rtl">
            <header class="live-map-header">
                <div class="live-map-heading">
                    <i class="fa-solid fa-map-location-dot" aria-hidden="true"></i>
                    <div>
                        <span class="live-map-title">מיקום העבודות</span>
                    </div >
                </div>
                <span class="live-map-count" id="liveMapLocationCount">טוען מיקומים…</span>
            </header>
            <div class="live-map-canvas-wrap">
                <div class="live-map-canvas" id="liveMapCanvas" role="application" aria-label="מפת מיקומי העבודות הפעילות"></div>
                <div class="live-map-empty" id="liveMapEmpty" hidden>
                    <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                    <span class="live-map-empty-title" id="liveMapEmptyTitle"></span>
                    <span class="live-map-empty-text" id="liveMapEmptyText"></span>
                </div>
            </div>
        </div>
    `;

    const mapCanvas = document.getElementById("liveMapCanvas");
    if (typeof L === "undefined"){
        mapCanvas.outerHTML = '<div class="live-map-error" role="status">המפה אינה זמינה כרגע.</div>';
        document.getElementById("liveMapLocationCount").textContent = "המפה אינה זמינה";
        return;
    }

    const map = L.map(mapCanvas, {
        zoomControl: false,
        scrollWheelZoom: true,
        minZoom: 6,
        maxZoom: 19,
    }).setView([31.7, 35.0], 7);
    liveShareJobLeafletMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">CleanerIL</a>'
    }).addTo(map);

    const count = document.getElementById("liveMapLocationCount");
    count.textContent = `זמינים`;

    const bounds = [];
    console.log("Available Jobs:", c_market.availableJob);
    c_market.availableJob.forEach((j) => {
        const marker = L.circleMarker(j.order.area_coordinate, {
            radius: 9,
            color: "#ffffff",
            weight: 2,
            fillColor: "#ee6941",
            fillOpacity: 1,
            className: "live-map-marker"
        });
        marker.bindPopup(renderLiveMapShareJobPopup(j), {maxWidth: 240});
        marker.addTo(map);
        bounds.push(j.order.area_coordinate||[31.7, 35.0]);
    });

    if (bounds.length === 1){
        map.setView(bounds[0], 11);
    } else if (bounds.length > 1){
        map.fitBounds(bounds, {padding: [28, 28], maxZoom: 12});
    } else {
        const empty = document.getElementById("liveMapEmpty");
        document.getElementById("liveMapEmptyTitle").textContent = 0
            ? "אין מיקומים להצגה"
            : "אין כרגע עבודות פעילות";
        document.getElementById("liveMapEmptyText").textContent = 0
            ? "העבודות פעילות, אבל עדיין לא נשמרו להן נקודות מיקום."
            : "עבודות חדשות יופיעו כאן לאחר שיתפרסמו.";
        empty.hidden = false;
    }

    window.setTimeout(() => map.invalidateSize(), 150);
}
