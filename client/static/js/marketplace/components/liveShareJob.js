
function highColorToLowFee(fee) {
    if (fee <= 0) return '#adecd3'; 
    if (fee <= 5) return '#F5C542'; 
    if (fee <= 10) return '#E6B84A';
    if (fee <= 20) return '#D6A85C'; 
    if (fee <= 30) return '#aeaeae';
    if (fee <= 50) return '#ededed'; 
    if (fee <= 75) return '#f6f6f6';
    return '#f6f6f6';
}

function feeAnyTypeToMoney(price, fee, feeType){
    if (feeType == FeeTypes.CASH)return fee
    return (price*fee)/100
}

async function renderLiveShareJob(job){
    const [text, icon] = getFeeTypeIconText(FeeTypes.CASH);
    const totalPrice = job.order.price-job.order.off_price;   
    const moneyFee = feeAnyTypeToMoney(totalPrice, job.fee, job.fee_type);
    const feeColor = highColorToLowFee(moneyFee);
    return `
    <div class="lt-item" id="live-${job.job_id}">
        <div class="company-avatar-wrapper">
            <img src="/static/images/logo/${job.from_company_logo}" class='lt-company-logo'>
        </div>
        <div class="lti-body">
            <span class="lti-name">עבודה ב-${getCleanOrderTypeText(job.job_type)} אזור ${job.order.area_name}, ${totalPrice}${icon}</span>
            <span class="lti-date-published" >פורסם ${getRelativeDate(job.last_update*1000)} ע"י ${limitWords(job.from_company_name, 12)}</span>
            <div class="lti-infos">
                <span> 
                    <i class="fa-solid fa-eye" data-label='צפיות'></i>
                    ${job.watches.length}
                </span>
                <span>
                    <i class="fa-solid fa-hand" data-label="בקשות"></i>
                    ${job.requests.length}
                </span>
                <span>
                    <i class="fa-solid fa-comment" data-label="תגובות"></i>
                    ${job.comments.length}
                </span>
                <span class="lti-fee" style="background:${feeColor}">${moneyFee}${icon} עמלה</span>
                
            </div>
        </div>
        <div class="lti-footer">
            <div class="lti-action client-card-action">
            <i class="fa-solid fa-arrow-left show" data-label="לפרטים" onclick="openJobDetails('${job.job_id}')"></i>
            </div>
        </div>
    </div>`
}

async function renderBoxLiveShareJob(){
    return`
    <div class="box-live-transactions">
        <div class="mlt-menu">
            <div class="mltm-item-title">
                <span>העברת עבודות</span>
            </div>
            <div class="mltm-item-live">
                <span>${c_market.availableJob.length}</span>
                <i class="fa-solid fa-circle"></i>
            </div>
        </div>
        <div class="lt-body">
        ${
            (await Promise.all(
            c_market.availableJob.map(job => renderLiveShareJob(job))
            )).join("") || '<div class="mlt-empty">אין כרגע עבודות להעברה</div>'
        }
        </div>
    </div>`
}
async function renderBoxJobDetails(){
    const job = c_market.getAJById(c_market.currentJobIdView);
    if (!job||!Object.values(job).length){return}
    const orderItems = Object.values(job.order.order_items)
    const itemRows = Object.values(job.order.order_items).map(item => {
        const name = item.name;
        const price = Number(item.price);
        return `
            <tr>
                <td>${name}</td>
                <td>${price}₪</td>
            </tr>
        `;
    }).join("");
    const totalPrice = job.order.price - job.order.off_price;
    const [feeLabel, feeIcon] = getFeeTypeIconText(FeeTypes.CASH);
    const feeAmount = feeAnyTypeToMoney(totalPrice, job.fee, job.fee_type);
    const isExpired = isDateExpired(job.availability_window*1000)
    const [ci, ct, cc] = getIconTextColorAssetApproval(job.company.c_verified)
    const [pi, pt, pc] = getIconTextColorAssetApproval(job.company.p_verified)
    const request = job.requests.find(r => r.manager_id == c_runtime.manager.manager_id);
    const requested = Boolean(request)
    const requestedDisabled = (job.stat & (JobMarketplaceState.SUSPENDED))||(request?.stat & (JobRequestState.BLOCKED|JobRequestState.REJECTED|JobRequestState.WAIT))
    let jobMarketTextState = '?'
    if (!requested){
        jobMarketTextState = getTextJobMarketState(job.state);
    }
    else{
        jobMarketTextState = getTextColorJobRequestState(request.stat)[0]
    }
    
    return `
    <div class="box-live-transactions">
        <div class="mlt-menu">
            <div class="mltm-item-title">
                <span>פרטי עבודה</span>
            </div>
            <div class="mltm-item-close" onclick="closeJobDetails()">
                <i class="fa-solid fa-xmark"></i>
            </div>
        </div>
        <div class="jd-body">
            <div class="jd-header">
                <div class="from-to-avatar">
                    <div class="company-avatar-wrapper ca-from">
                        <img src="/static/images/logo/${job.from_company_logo}" class='lt-company-logo'>
                    </div>
                    <div class="from-to-line" aria-hidden="true"></div>
                    <div class="company-avatar-wrapper ca-to">
                        <i class="icon icon-50">${await icon("globe-destination")}</i>
                    </div>
                </div>
                <div class="from-to-avatar fta-name-targets">
                    <span>${job.from_company_name}</span>
                    <span>כולם</span>
                </div>
                <div class="jdh-actions">
                    <i class="fa-solid fa-comment jdhi-comment" ></i>
                    <i class="fa-brands fa-whatsapp jdhi-whatsapp"></i>
                    <i class="fa-solid fa-phone jdhi-call" ></i>
                </div>
            </div>
            <div class="stm-boxes">
                <div class='stm-box'>
                    <span>פרטי המפרסם</span>
                    <div class="stmb-item">
                        <span>עסק</span>
                        <div class='stmbi-values'>
                            <span style="color:${cc}">${ct}</span>
                            <i class='icon icon-16'>${await icon(ci)}</i>
                        </div>
                    </div>
                    <div class="stmb-item">
                        <span>בעלים</span>
                        <div class='stmbi-values'>
                            <span style="color:${pc}">${pt}</span>
                            <i class='icon icon-16'>${await icon(pi)}</i>
                        </div>
                    </div>
                    <div class="stmb-item">
                        <span>שם העסק</span>
                        <span>${job.from_company_name}</span>
                    </div>
                    <div class="stmb-item">
                        <span>שם הבעלים</span>
                        <span>${job.company.owner_fullname}</span>
                    </div>
                </div>
                <div class='stm-box'>
                    <span>פרטי ההזמנה</span>
                    <div class="stmb-item">
                        <span>פורסם</span>
                        <div class='stmbi-values'>
                            <span>${getRelativeDate(job.time_created*1000)}</span>
                        </div>
                    </div>
                    <div class="stmb-item">
                        <span>סוג שירות</span>
                        <div class='stmbi-values'>
                            <span>${getCleanOrderTypeText(job.job_type)}</span>
                            <i class="${getCleanOrderTypeIcon(job.job_type)}"></i>
                        </div>
                    </div>
                    <div class="stmb-item">
                        <span>פריטים בהזמנה</span>
                        <div class='stmbi-values'>
                            <span>${orderItems.length}</span>
                        </div>
                    </div>
                    <div class="stmb-item">
                        <span>אזור עבודה</span>
                        <div class='stmbi-values'>
                            <span>${job.order.area_name}</span>
                            <i class="fa-solid fa-map-location-dot"></i>
                        </div>
                        <div class="stmbiv-notes">
                            <i class="fa-solid fa-circle-info"></i>
                            <span>כתובת מלאה תופיע אחרי העברת הלקוח אליך</span>
                        </div>
                    </div>
                    <div class="stmb-item">
                        <span>הגעה ללקוח</span>
                        <div class='stmbi-values'>
                            <span>${!isExpired?dateFloatToYMDNDH(job.availability_window):"התאריך עבר"}</span>
                        </div>
                    </div>
                
                </div>
                <div class='stm-box'>
                    <span>פרטי עיסקה</span>
                    <div class="stmb-item">
                        <span>סכום עיסקה</span>
                        <span>${totalPrice}${feeIcon}</span>
                    </div>
                    <div class="stmb-item">
                        <span>עמלה עבור הלקוח</span>
                        <span>${feeAmount}${feeIcon}-</span>
                    </div>
                    <div class="stmb-item">
                        <span>מע"מ</span>
                        <span>${job.tax?'כן':'לא'}</span>
                        <div class="stmbiv-notes">
                            <i class="fa-solid fa-circle-info"></i>
                            <span>האם העסק מבקש שתשתתף במע"מ בחלוקה שווה</span>
                        </div>
                    </div>
                    <div class="stmb-item">
                        <span>סך הכל עבורך</span>
                        <span style="color:#2f6f51;">${totalPrice-feeAmount}${feeIcon}+</span>
                    </div>
                </div>
                <div class="stm-footer" style="margin-top: auto;">
                    <div class="stm-notes">
                    <span>אחרי שאושרה העברה כל פרטי הלקוח יופיע לך גם באזור האישי</span>
                    </div>
                    <button type="button" class="${requestedDisabled?'stm-btn-error':'stm-btn-done'} show" onclick="requestToJobMarket()" id="JMRequest" ${requested?'disabled':''}>
                        <span>${jobMarketTextState}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
}
async function initLiveShareJob(){
    const parent = document.getElementById("liveShareJob")
    const livesj = await renderBoxLiveShareJob()
    parent.innerHTML = livesj;

}

async function initJobDetails(jid){
    const job = c_market.getAJById(jid)
    if (!job)return
    const jobDetails = document.getElementById(SectionMarketView.JOB_DETAILS);
    const JobLive = document.getElementById(SectionMarketView.LIVE_JOB);
    JobLive.classList.remove("show")
    JobLive.classList.add("hide")
    jobDetails.classList.add("show")
    jobDetails.innerHTML = await renderBoxJobDetails()
    setTimeout(callViewJob, 1000)
}


async function openJobDetails(jid){
    c_market.currentJobIdView = jid;
    const job = c_market.getAJById(jid)
    if (!job)return
    focusJobOnMap(jid);
    initJobDetails(jid)
    
}

function closeJobDetails(){
    const jobDetails = document.getElementById(SectionMarketView.JOB_DETAILS);
    const JobLive = document.getElementById(SectionMarketView.LIVE_JOB);
    JobLive.classList.add("show")
    JobLive.classList.remove("hide")
    jobDetails.classList.remove("show") 

    c_market.currentJobIdView = null
}

async function requestToJobMarket(){
    const btn = document.getElementById("JMRequest")
    const span = btn.children[0];
    const before = () =>{
        btn.disabled = true;
        span.textContent = 'שולח..'
    }
    const after = ()=>{
        btn.disabled = false;
        span.textContent = 'שלח בקשה'
    }
    const success = ()=>{
        btn.disabled = true;
        span.textContent = 'ממתין לאישור'
    }
    const error = (res) =>{
        btn.classList = []
        btn.classList.add("stm-btn-error", "show")
        span.textContent = res.notice;
        btn.disabled = true;
    }
    await doJobRequest(before, after, success, error)
}