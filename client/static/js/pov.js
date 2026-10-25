const c_pov = {
    publicCleanOrderVerified:{},
    orderId:null,
    authShow:false
}

document.addEventListener("DOMContentLoaded", ()=>{
    form = document.getElementById('verify-form');
    input = document.getElementById('cleanOrderId');

    document.getElementById('year').textContent = new Date().getFullYear();
    input.addEventListener('input', () => {
        const validFormat = input.value.split("-").length == 2
        !validFormat?input.classList.add("invalid"):input.classList.remove("invalid")

    });


    form.addEventListener('submit', async event => {
        doCleanOrderVerifiction(event)

    });
    onInitPovCheckURLParams()
})


function showResult(stat, title, text) {
    result = document.getElementById('verify-result');
    result.className = `result visible r-${stat}`;
    result.innerHTML = `<i class="${getIconByStatToast(stat)}"></i>`
    const copy = document.createElement('div'),
        heading = document.createElement('strong'),
        message = document.createElement('span');
    heading.textContent = title;
    message.textContent = text;
    copy.append(heading, message);
    result.append(copy);
}

function removeResult(){
    result = document.getElementById('verify-result');
    result.classList.remove("visible")
    result.replaceChildren()
}

function onSubmitVerifiction(){
    const btn = document.getElementById("verify-button")
    btn.children[0].textContent = 'בודק...'
    btn.disabled = true;

}
function onResponseVerifiction(success = true){
    const btn = document.getElementById("verify-button");
    btn.children[0].textContent = 'אימות הזמנה'
    btn.disabled = false;
    if (!success)return
    const input = document.getElementById("cleanOrderId")
    input.disabled = true;
    btn.children[0].textContent = 'הצג פרטים'
    btn.type = "button";
    if (!c_pov.authShow){
        btn.onclick = showOrderVerified;
    }
    else{
        showOrderVerified()
    }
    

}
function showIsValidOrderID(){
    const orderIdVerified = document.getElementById("orderIdVerified")
    orderIdVerified.style.display = 'block'

}

async function showOrderVerified(){

    const data = c_pov.publicCleanOrderVerified;
    const btn = document.getElementById("verify-button");
    const form = document.getElementById("verify-form");
    const input = document.getElementById("cleanOrderId");
    const orderStatText = getOrderStatText(data.stat).replace("!", "")
    const orderStatIcon = getOrderStatIcon(data.stat)
    const orderStatIconColor = getOrderStatIconColor(data.stat)
    const orderDate = new Date(data.date * 1000).toLocaleDateString("he-IL", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    input.remove()
    form.replaceChildren()
    form.insertAdjacentHTML("afterend", `
        <section class="verified-order-details" id="verified-order-details" aria-labelledby="verified-order-title">
            <div class="verified-order-header" aria-hidden="true">
                <div>
                    <i class="icon icon-24">${await icon("verify")}</i>
                    <p>משוייך לעסק ב-cleanerIL</p>
                </div>
                <span class="close-verified" onclick="newVerify()">
                    <i class="fa-solid fa-arrow-rotate-left"></i>
                   <span>בדיקה נוספת</span>
                </span>
            </div>
            <div class="verified-order-copy">
                <h2 id="verified-order-title">פרטי ההזמנה</h2>
            </div>
            <div class="order-verified-items">
                <div class="order-verified-item" aria-label="מספר ההזמנה ייחודי">
                    <i class="fa-solid fa-fingerprint"></i>
                    <div>
                        <dt>מזהה</dt>
                        <dd id="verified-order-value">${c_pov.orderId}</dd>
                    </div>
                </div>
                <div class="order-verified-item" aria-label="פרטי הספק">
                    <i class="fa-regular fa-building"></i>
                    <div>
                        <dt>שם העסק</dt>
                        <dd>${data.company_name}</dd>
                    </div>
                </div>
                <div class="order-verified-item" aria-label="פרטי יצירת קשר">
                    <i class="fa-solid fa-square-phone-flip"></i>
                    <div>
                        <dt>מספר העסק</dt>
                        <a href="tel:${data.company_phone}">${data.company_phone}</a>
                    </div>
                </div>
                <div class="order-verified-item" aria-label="סטטוס הזמנה">
                    <i class="${orderStatIcon}" style="color:${orderStatIconColor} !important;"></i>
                    <div>
                        <dt>מצב הזמנה</dt>
                        <dd>${orderStatText} בתאריך ${orderDate}</dd>
                    </div>
                </div>
            </div>
        </section>
    `);

    addOrderIdToUrlParams()
}

function addOrderIdToUrlParams(){
    const orderId = c_pov.orderId?.trim();
    if (!orderId) return;

    const url = new URL(window.location.href);
    url.searchParams.set("orderId", orderId);
    window.history.replaceState({}, "", url);
}


function newVerify(){
    const url = new URL(window.location.href);
    url.searchParams.delete("orderId");
    window.history.replaceState({}, "", url);
    window.location.reload();
}



async function doCleanOrderVerifiction(event){
    removeResult()
    if (event)event.preventDefault()
    const input = document.getElementById("cleanOrderId")
    const rawValue = input.value;
    const [key, orderId] = rawValue.trim().split("-");

    if (!key || !orderId) {
        input.focus();
        showResult(ToastStat.ERROR, 'מזהה לא תקין', 'יש להזין את המזהה כפי שמופיע על גבי ההזמנה.');
        return;
    }
    onSubmitVerifiction()
    const data = {action:PublicApi.cleanOrderVerifiction, key:key, oi:orderId}
    await apiPost("/papi", data).then(
        (res) =>{
            if (!res.success){
                showResult(ToastStat.ERROR, res.title, res.notice)
            }else{
                // Supports both a flat JSON response and a {data: PovDetails} wrapper.
                showIsValidOrderID()
                c_pov.publicCleanOrderVerified = res
                c_pov.orderId = rawValue;
            }
            onResponseVerifiction(res.success)

        }
    )


}


function onInitPovCheckURLParams(){
    const url = new URL(window.location.href);
    const orderId = url.searchParams.get("orderId");
    input = document.getElementById('cleanOrderId');
    if (!orderId)return
    input.value = orderId
    c_pov.authShow = true;
    doCleanOrderVerifiction()
}
