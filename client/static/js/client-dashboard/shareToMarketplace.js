const STMMode = {
    CREATE:1,
    VIEW:2
}


const c_stm = {
    feeType:1,
    feeValue:0,
    startPart:1,
    currentPart:1,
    jobDescription:"",
    tax:false,
    mode:STMMode.CREATE,
    reset: function(){
        this.feeType = 1;
        this.feeValue = 0;
        this.currentPart = 1;
        this.startPart = 1;
        
        this.jobDescription = "";
        this.tax = false;
    },
    init:function(mode){
        if (mode==STMMode.CREATE){
        }
        else if (mode==STMMode.VIEW){
        this.currentPart = 4
        this.startPart = this.currentPart
        }
        this.mode = mode||STMMode.CREATE
    }
}

const FeeTypes = {
    CASH:1,
    PERCENT:2
}

function getFeeTypeIconText(ft){
    switch (ft) {
        case FeeTypes.CASH:
            return ['סכום', "₪"]    
        case FeeTypes.PERCENT:
            return ['אחוזים', '%']
    }
}

async function renderShareToMarketplace(){
    const order = ClientStore.getOrder(c_runtime.currentOrderIdView);
    const client = ClientStore.getClient(c_runtime.currentOrderIdView);
    let stmSummary = ""
    if (!order)return
    const totalPrice = order.price-order.off_price;
    const shareExpired = new Date(order.date*1000).toLocaleDateString("he-IL", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
    if (c_stm.mode == STMMode.VIEW){
        stmSummary = renderSummaryShareToMarketplace(order.order_id)

        
    }
    return `
        <div class="share-to-marketplace" id='stm-parts-ui'>
            <div class="stm-head">
                <i class="icon icon-48">${await icon("globe") }</i>
                <span>שיתוף והעברת לקוח</span>
            </div>
            <div class="stm-parts" id="stm1">
                <div class="stm-input-box">
                    <div class='stmi-head'>
                        <span id="feeTypeView">עמלה בסכום</span>
                        <div class="stm-fees-type">
                            <i class='icon icon-24 show' id='fee1' onclick="switchFeeType(1)">${await icon("shekel2")}</i>
                            <i class='icon icon-24' id='fee2' onclick="switchFeeType(2)">${await icon("percent")}</i>
                        </div>
                    </div>
                    <div class="stm-input">
                        <input type="text" inputmode="decimal" placeholder='0' oninput="formatMarketplaceFee(this)">
                    </div>

                </div>
                <div class="stm-footer">
                    <div class="stm-notes">
                        <span>המקסימום לעמלה עד 50%</span>
                    </div>
                    <button type="button" class="stm-btn-continue" onclick="stmContinueSummary()">
                        <span>המשך</span>
                    </button>
                </div>
            </div>
            <div class="stm-parts" id="stm2" style="justify-content: flex-start;">
                <span class="stm-sub-title">כל הפרטים נכונים?</span>
                <div class="stm-boxes">
                    <div class='stm-box'>
                        <span>על פרטי ההזמנה</span>
                        <div class="stmb-item">
                            <span>כתובת לקוח</span>
                            <span>${order.address}</span>
                        </div>
                        <div class="stmb-item">
                            <span>שם מלא</span>
                            <span>${order.fullname}</span>
                        </div>
                        <div class="stmb-item">
                            <span>מספר פלאפון</span>
                            <span>${order.phone}</span>
                        </div>
                    </div>
                    <div class='stm-box'>
                        <span>מחיר העיסקה ועמלת העברה</span>
                        <div class="stmb-item">
                            <span>סכום העיסקה</span>
                            <span>${totalPrice}</span>
                        </div>
                        <div class="stmb-item">
                            <span>עמלת עיסקה</span>
                            <span id="feeValueView"></span>
                        </div>
                        <div class="stmb-item">
                            <span>סה"כ</span>
                            <span id="summarPayment"></span>
                        </div>
                    </div>
                    <div class='stm-box'>
                        <span>הגדרות שיתוף</span>
                        <div class="stmb-item">
                            <span>פג תוקף</span>
                            <span>${shareExpired}</span>
                        </div>
                    </div>
                </div>
                <div class="stm-footer" style="margin-top: auto;">
                    <div class="stm-notes">
                        <span class='stmn-title'>שם לב</span>
                        <span>לא ניתן לשנות פרטי הזמנה לאחר הפרסום</span>
                        <span>פרטי ההזמנה יופיעו בצורה חלקית עד לאישור ההעברה</span>
                        <span>בהעברת עבודה פרטי מקור הלקוח ישארו על שמך</span>
                    </div>
                    <button type="button" class="stm-btn-continue" onclick="doShareOrderClientToMarketplace()">
                        <span>שיתוף במרקט</span>
                    </button>
                </div>
            </div>
            <div class="stm-parts" id="stm3" style="justify-content:flex-start;"> 
                <i class="stm-background">${await icon("background-stm")}</i>
                <div class="stm-loader-wrap">
                    <div class="loader-circle-hot-border" id="shareTMLoading"></div>
                    <span class="stm-loader-about" id='stmLoadAbout'></span>
                </div>
                <div class="stm-footer" style="margin-top: auto;">
                    <div class="stm-notes" id="whenSTMResponse">
                    </div>
                    <button type="button" class="stm-btn-done" onclick="closeShareToMarketplace()" id="stmbDone">
                        <span>סגירה</span>
                    </button>
                    <button type="button" class="stm-btn-error" onclick="doShareOrderClientToMarketplace(true)" id="stmbError">
                        <span>נסה שוב</span>
                    </button>
                </div>
            </div>
            ${stmSummary}
        </div>
    `
}

function renderSummaryShareToMarketplace(orderID){

    const job = c_runtime.myJobs.find(o => o.order_id == orderID);
    if (!job)return ''
    const watches = job.watches;
    const requests = job.requests;
    const comments = job.comments;
    const [text,icon] = getFeeTypeIconText(job.fee_type)
    const [stateText, stateColor] = getJobStateTextColor(job.state);
    return `
    <div class="stm-parts" id="stm4" style="justify-content: flex-start;">
        <span class="stm-sub-title">סיכום הזמנה משותפת</span>
        <div class="stm-boxes">
            <div class='stm-box'>
                <span>מעורבות</span>
                <div class="stmb-item">
                    <span>צפיות</span>
                    <div class='stmbi-values onhover' data-label="לרשימה">
                        <span>${watches.length}</span>
                        <i class="fa-solid fa-eye"></i>
                    </div>
                </div>
                <div class="stmb-item">
                    <span>בקשות</span>
                    <div class='stmbi-values onhover' data-label="לרשימה" onclick='showJobRequests()'>
                        <span>${requests.length}</span>
                        <i class="fa-solid fa-hand"></i>
                    </div>
                </div>
                <div class="stmb-item">
                    <span>תגובות</span>
                    <div class='stmbi-values onhover' data-label="לרשימה">
                        <span>${comments.length}</span>
                        <i class="fa-solid fa-comment"></i>
                    </div>
                </div>
            </div>
            <div class='stm-box'>
                <span>מידע & פעולות</span>
                <div class="stmb-item">
                    <span>מצב</span>
                    <div class='stmbi-values'>
                        <span style="color:${stateColor};">${stateText}</span>
                    </div>
                </div>
                <div class="stmb-item">
                    <span>פורסם</span>
                    <div class='stmbi-values'>
                        <span>${getRelativeDate(job.time_created*1000)}</span>
                        <i class="fa-solid fa-clock"></i>
                    </div>
                </div>
                <div class="stmb-item">
                    <span>עמלה</span>
                    <div class='stmbi-values onhover' data-label="עריכה">
                        <span>${job.fee}</span>
                        <i>${icon}</i>
                    </div>
                </div>
                <div class="stmb-item">
                    <span>פג תוקף</span>
                    <div class='stmbi-values onhover'>
                        <span>${getRelativeDate(job.availability_window*1000)}</span>
                        <i class="fa-solid fa-clock"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="stm-footer" style="margin-top: auto;">
            <div class="stm-notes">
            </div>
            <button type="button" class="stm-btn-error show" onclick="cancelShareOrderToMarketplace('${orderID}')" id="stmCancel">
                <span>ביטול שיתוף</span>
            </button>
        </div>
    </div>
    ${renderListRequestsToJob(orderID)}`
}

function showJobRequests(){
    forwardFromPartOnStm()
}
function hideJobRequests(){
    backFromPartOnStm()
}

function renderJobRequest(req){
    const managerId = req.manager_id;
    const companyName = req.company_name
    const ownerName = req.owner_fullname;
    const description = 'תיאור'
    const companyLogo = req.company_logo || "default_logo.png";
    const timing = getRelativeDate(req.time_created*1000)
    const [textStat,colorStat] = getTextColorJobRequestState(req.stat)
    const showAction = req.stat==JobRequestState.WAIT

    return `
        <div class='jmrc'>
            <article class="jm-request-card" dir="rtl">
                <img class="jm-request-avatar" src="/static/images/logo/${companyLogo}" alt="" aria-hidden="true" loading="lazy" onerror="this.onerror=null;this.src='/static/images/logo/default_logo.png'">
                <div class="jm-request-content">
                    <div class="jm-request-topline">
                        <span class="jm-request-name" title="${companyName}">${companyName}</span>
                        <span class="jm-request-status">
                            <i class="fa-solid fa-hand" aria-hidden="true"></i>
                            ${timing}
                        </span>
                    </div>
                    <div class="jm-request-description">
                        <i class="fa-solid ${companyName && ownerName ? "fa-user" : "fa-circle-info"}" aria-hidden="true"></i>
                        <span style='color:${colorStat};'>${textStat}</span>
                    </div>
                </div>
            </article>
            <div class='jm-footer'>
                ${showAction?`<button type="button" class="stm-btn-done jm-btn" onclick="initEstablishedShareJob('${req.job_id}', '${req.request_id}')" id="jm-approve">
                    <span>המשך</span>
                </button>
                <button type="button" class="stm-btn-error jm-btn jm-btn-reject" onclick="initRejectShareJob('${req.job_id}', '${req.request_id}')" id="jm-rejact">
                    <span>דחה</span>
                </button>
                <button type="button" class="stm-btn-error jm-btn jm-btn-reject" onclick="initDeleteRequestShareJob('${req.job_id}', '${req.request_id}')" id="jm-remove">
                    <span>מחק</span>
                </button>`:''}
            </div>
        </div>`;
}
function renderListRequestsToJob(orderID){
    const job = c_runtime.myJobs.find(j => j.order_id == orderID);
    console.log(job)
    if (!job) return '';
    const requests = job.requests.sort(r=>r.stat&JobRequestState.APPROVED)
    return `
    <div class="stm-parts" id="stm5" style="justify-content: flex-start;">
        <span class="stm-sub-title">בקשות להעברת לקוח</span>
        <div class='jm-requests-list'>
            ${
            requests.map(req => renderJobRequest(req))
            .join("") || '<div class="mlt-empty">אין כרגע בקשות </div>'
        }
        </div>
    </div>
    `
}

function removeListRequestsToJob(){
    const parent = document.getElementById("stm5")
    if (!parent)return
    parent.remove();
}


function hideSTMPart(p){
    const part = document.getElementById("stm"+p)
    if (!part?.classList.contains("show")) return;
    part.classList.add("stm-slide-out");
    setTimeout(()=>{part.classList.remove("show", "stm-slide-out");}, 1000)
}
function showSTMPart(p){
    const part = document.getElementById("stm"+p)
    if (!part || part.classList.contains("show")) return;
    part.classList.add("show")
    c_stm.currentPart =p

}
function stmContinueSummary(){
    const order = get_order_by_order_id(c_runtime.currentOrderIdView);
    const totalPrice = order.price-order.off_price
    const feeValue = parseInt(c_stm.feeValue||0)
    if ((feeValue > 50 && c_stm.feeType == FeeTypes.PERCENT) || totalPrice/2 < c_stm.feeValue){
        showToast(message.IFeeValueSTM, ToastStat.ERROR);
        return
    }
    forwardFromPartOnStm()

    const feeValueView = document.getElementById("feeValueView");
    const summarPayment = document.getElementById("summarPayment");
    const [text, icon] = getFeeTypeIconText(c_stm.feeType)

    feeValueView.textContent = feeValue + icon+"-"
    if (c_stm.feeType == FeeTypes.CASH){
        summarPayment.textContent = `${totalPrice-feeValue}${icon}+`
    }
    else if (c_stm.feeType == FeeTypes.PERCENT){
        summarPayment.textContent = `${totalPrice -( (totalPrice*feeValue)/100)}₪+`
    }
}

function switchFeeType(ft){
    Object.values(FeeTypes).forEach(value => {
    document.getElementById("fee"+value)?.classList.remove("show")
    });
    const fee = document.getElementById("fee"+ft)
    const feeView = document.getElementById("feeTypeView");
    fee.classList.add("show")
    const input = document.querySelector(".share-to-marketplace .stm-input input");
    if (input) formatMarketplaceFee(input);
    if (ft == FeeTypes.CASH){feeView.textContent = 'עמלה בסכום'}
    else if (ft == FeeTypes.PERCENT){feeView.textContent = 'עמלה באחוזים'}

    c_stm.feeType = ft
}

function formatMarketplaceFee(input){
    const feeType = document.getElementById("fee2")?.classList.contains("show") ? FeeTypes.PERCENT : FeeTypes.CASH;
    const suffix = feeType === FeeTypes.PERCENT ? "%" : "₪";
    const value = input.value.replace(/[₪%]/g, "").trim();
    const cursorPosition = Math.min(input.selectionStart ?? value.length, value.length);
    input.value = value ? `${value}${suffix}` : "";
    input.setSelectionRange(cursorPosition, cursorPosition);

    const order = get_order_by_order_id(c_runtime.currentOrderIdView);
    const totalPrice = order ? order.price - order.off_price : 0;
    const fee = Number(value);
    const exceedsHalf = feeType === FeeTypes.PERCENT
        ? fee > 50
        : fee > totalPrice / 2;
    input.style.color = value && Number.isFinite(fee) && exceedsHalf ? "#af2e2e" : "rgb(45, 74, 96)";
    c_stm.feeValue = value
}


function backFromPartOnStm(){
    if (c_stm.currentPart == 1 || c_stm.currentPart == 4){
        closeShareToMarketplace()
        return
    }
    hideSTMPart(c_stm.currentPart)
    showSTMPart(c_stm.currentPart-1)
}
function forwardFromPartOnStm(){
    hideSTMPart(c_stm.currentPart)
    showSTMPart(c_stm.currentPart+1)
}


function onSubmitSTM(){
    const stmbError = document.getElementById("stmbError");
    const stmbDone = document.getElementById("stmbDone")
    stmbDone.classList.remove("show");stmbError.classList.remove("show")
    const shareTMLoading = document.getElementById("shareTMLoading")
    const stmLoadAbout = document.getElementById("stmLoadAbout")
    const whenSTMResponse = document.getElementById("whenSTMResponse")
    whenSTMResponse.replaceChildren()
    stmLoadAbout.textContent ='מפרסם..'
    shareTMLoading.classList = []
    shareTMLoading.classList.add("loader-circle-hot-border")

    const arfc = document.getElementById("arfc");
    const accd = document.getElementById("accd");
    arfc.classList.remove("show");arfc.classList.add("hide")
    accd.classList.remove("hide");accd.classList.add("show")
}


function onResponseSTM(res){
    const stmLoading = document.getElementById("shareTMLoading");
    const stmLoadAbout = document.getElementById("stmLoadAbout");
    const stmbDone = document.getElementById("stmbDone")
    const stmbError = document.getElementById("stmbError")
    const whenSTMResponse = document.getElementById("whenSTMResponse")
    const error = !res||!res.success
    const done = res&&res.success

    if (error){
        const notice = document.createElement("span");
        notice.textContent = res?.notice||"התרחשה שגיאה"
        whenSTMResponse.appendChild(notice)
        stmLoadAbout.textContent = 'לא פורסם'
        stmLoading.classList.add("stm-error")
        stmbError.classList.add("show")
    }
    else if (done){
        stmLoadAbout.textContent = 'פורסם'
        stmLoading.classList.add("stm-done")
        stmbDone.classList.add("show")
    }
}
async function doShareOrderClientToMarketplace(again){
    onSubmitSTM()
    !again&&forwardFromPartOnStm()
    const fee = c_stm.feeValue.replace(/\D/g, '');
    const data = {action:MarketplaceApiCall.shareOrderMarketplace,oi:c_runtime.currentOrderIdView,
        fee:fee,feet:c_stm.feeType,desc:c_stm.jobDescription,tax:c_stm.tax,s:JobMarketplaceState.AVAILBALE
    }
    const res = await apiPost(ApiRoute.marketplace, data)
    if (!res || !res.success){
        onResponseSTM(res)
        return
    }
    EventRegistry.emit(AppEvent.ORDER_STM, res)
    onResponseSTM(res)

}



async function closeShareToMarketplace(){
    // const ask = await showAsk({title:"שיתוף לקוח", msg:"לבטל את השיתוף?"})
    // if (!ask)return

    hideClientShareMarketplace()
    c_clients.enterStm = false;
    c_stm.reset();
    switchViewClientDashboard(c_c_dashboard.lastDView)
}
