const c_settings = {
    max_size_logo:5*(1024*1024),
    sad:{
        c_name: null,
        c_desc: null,
        c_name_owner: null,
        c_email: null,
        c_vat: null,
        c_vat_code: null,
        c_phone: null,
        c_owner_phone: null,
        c_gpse: null,
        c_show_vcio:null
    }, // setting api data
    vat_company_selected:null

}

function setLogo() {
    const input = document.getElementById("setLogo");
    input.click();
}

function setTagSubscription(){
    const logoCompanyTag = document.getElementById("logoCompanyTag");
    const plan = c_runtime.subscription?.subscription_plan || UserAccountSubscription.FREE;
    const planName = getUserAccountSubscriptionTextEnglish(plan);
    logoCompanyTag.textContent = planName;
    logoCompanyTag.classList.add(planName.toLocaleLowerCase())

    const companyVerified = document.getElementById("companyVerified");
    const companyUnverified = document.getElementById("companyUnverified");
    if (c_runtime.company.company_approved && c_runtime.manager.account_approved){
        companyVerified.classList.add("show")
    }
    else{
        companyUnverified.classList.add("show")
    }

}
function setShowVatCode(){
    const showVatCodeView = document.getElementById("showVatCodeView");
    const showVatCodeOnOrder = document.getElementById("showVatCodeOnOrder");
    showVatCodeView.textContent = c_runtime.company.show_vat_code_order?"מוצג":"לא מוצג"
    toggleShowIdOnOrder()
}
function onLoadSetttings(){
    setTagSubscription() 
    setShowVatCode()   
    c_settings.vat_company_selected = c_runtime.company.vat_company
    const taxTypeView = document.getElementById('taxTypeView');
    taxTypeView.textContent = getCompanyIsVatText(c_runtime.company.vat_company)

}

/**
 * Create an edit modal for inline editing
 */
function emsCurrentValue(){return document.getElementById("emsCurrentValue").value}
function createEditModal(title, currentValue, sad, {content = 0, save = true} = {}) {
    // Remove existing modal if any
    const settingsContentModal = document.getElementById("settingsContentModal")
    const settingsDefaultContentModal = document.getElementById("settingsDefaultContentModal");
    const modal = document.getElementById("settingsEditModal");
    const elTitle = document.getElementById("emsTitle");
    const lastValue = document.getElementById("emsLastValue");
    const elCurrentValue = document.getElementById("emsCurrentValue");
    const emsSave = document.getElementById("emsSave");
    elTitle.textContent = title
    const h = (e) => {e.classList.add("hide");e.classList.remove("show")}
    const s = (e) => {e.classList.add("show");e.classList.remove("hide")}
    if (content){
        settingsContentModal.innerHTML = content;
        h(settingsDefaultContentModal)
        s(settingsContentModal)
    }
    else{
        s(settingsDefaultContentModal)
        h(settingsContentModal)
    }
    if (!save){
        h(emsSave)
    }
    else{
        emsSave.onclick = () => {
            saveManagerSettings(sad())
    }
    }
    elCurrentValue.value = currentValue

    modal.classList.add("show")
        setTimeout(() => {
        elCurrentValue.focus();
        elCurrentValue.select();
    }, 100);
    // Save on Enter
    elCurrentValue.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveManagerSettings();
        if (e.key === 'Escape') closeEditModal();
    });
}

function editCompanyName() {
    const data = ()=>({c_name:emsCurrentValue()})
    createEditModal("עדכן שם העסק", c_runtime.company.company_name, data);
}
function editCompanyDesciption(){
    const data = () => ({c_desc:emsCurrentValue()})
    createEditModal("עדכן תיאור לעסק", c_runtime.company.company_description, data)
}
function editCompanyPhone(){
    const data = ()=>({c_phone:emsCurrentValue()})
    createEditModal("עדכן פלאפון עסק", c_runtime.company.company_phone, data)
}

function editCompanyEMail(){
    const data = ()=> ({c_email:emsCurrentValue()})
    createEditModal("עדכן מייל ", c_runtime.company.company_email, data)
}
function editCompanyVAT(){
    const data = ()=> ({c_vat_code:emsCurrentValue()})
    createEditModal("עדכן מספר עוסק", c_runtime.company.company_VAT, data)
}
function editCompanyGPSE(){
    const data = ()=> ({c_gpse:emsCurrentValue()})
    createEditModal("הגדרת חלוקת רווחים לעיסקה", c_runtime.company.gpse, data)
}

async function saveManagerSettings(sad, callback = null){
    const emsSave = document.getElementById("emsSave");
    emsSave.classList.add("loading")

    const data = {action:ApiCall.manager_settings, ...sad}
    const res = await apiPost(ApiRoute.api, data);
    const toast = showToast("מגדיר...");
    callback?callback(res):null
    if (!res.success){
        showToast(res.notice, ToastStat.ERROR, toast);
    }else{
        showToast(res.notice, ToastStat.DONE, toast);
        location.reload()

    }
    emsSave.classList.remove('loading')

}
/**
 * Create a selector modal for tax status
 */
function createTaxStatusModal(title) {
    const data = () => ({c_vat:c_settings.vat_company_selected})
    const vat_company_text = getCompanyIsVatText(c_settings.vat_company_selected)
    const patoor = c_settings.vat_company_selected == CompanyTaxType.PATOOR
    const ttitle = 'סוג תיק עוסק'
    const html = `
        <div class="settings-tax-options">
            <div class="settings-tax-option ${!patoor ? 'active' : ''}" onclick="selectTaxStatus(${CompanyTaxType.MOORSHE}, event)">
                <i class="fa-solid fa-check"></i>
                <div>
                    <span class="settings-tax-title">עוסק מורשה</span>
                    <span class="settings-tax-desc">חייב בתשלום מע"מ</span>
                </div>
            </div>
            <div class="settings-tax-option ${patoor ? 'active' : ''}" onclick="selectTaxStatus(${CompanyTaxType.PATOOR}, event)">
                <i class="fa-solid fa-check"></i>
                <div>
                    <span class="settings-tax-title">עוסק פטור</span>
                    <span class="settings-tax-desc">פטור ממע"מ</span>
                </div>
            </div>
        </div>
    `;
    createEditModal(title, c_runtime.company.vat_company, data, {content:html})
}

function closeEditModal() {
    const modal = document.getElementById('settingsEditModal');
    modal.classList.remove("show")
    
}

/**
 * Select tax status option
 */
function selectTaxStatus(company_vat, e) {
    c_settings.vat_company_selected = company_vat
    const options = document.querySelectorAll('.settings-tax-option');
    options.forEach(opt => opt.classList.remove('active'));
    e.currentTarget.classList.add('active');
}

/**
 * Edit tax status
 */
function editVATOrNot() {
    createTaxStatusModal('בחר סוג עוסק');
}

function editShowVatCodeOnOrder(){
    const showVatCodeOnOrder = document.getElementById("showVatCodeOnOrder")
    const call = () => ({c_show_vcio:showVatCodeOnOrder.checked})
    const onFailed = (res) =>{
        if (res.success)return
        toggleShowIdOnOrder()
    }
    saveManagerSettings(call(), onFailed)
}


function editIntegration({provider,provider_name, title, icon, description, url, action, note, tone}) {
    const html = `
        <div class="settings-integration settings-integration-${tone}">
            <div class="settings-integration-intro">
                <div class="settings-integration-icon" aria-hidden="true">
                    <i class="${icon}"></i>
                </div>
                <div class="settings-integration-heading">
                    <span class="settings-integration-title">${provider_name}</span>
                    <span class="settings-integration-desc">${description}</span>
                </div>
                <span class="settings-integration-status" id='integrationStatus'>לא מחובר</span>
            </div>
            <!--<div class="settings-integration-note">
                <div><i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                <span>${note}</span></div>
                <div><i class="fa-solid fa-lock" aria-hidden="true"></i>
                <span>ההרשאה מנוהלת ישירות על ידי ${provider_name}</span></div>
            </div>-->
            <button class="settings-integration-action" type="button" onclick="doIntegration(${provider})" id="integrationApp">
                <span>התחבר</span>
                <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
            </button>
        </div>
    `

    createEditModal("חיבור לספק צד שלישי", null, null, {content:html, save:false})
    document.getElementById('emsSave').classList.add('hide')
}

function editMetaIntegration() {
    editIntegration({
        provider:AppIntegration.META_ADS,
        provider_name: getAppIntegrationName(AppIntegration.META_ADS),
        icon: 'fa-brands fa-meta',
        description: 'חיבור ל Meta Business לצורך נתוני קמפיינים',
        url: 'https://www.facebook.com/business/help/898185486719827?id=1205376682832142',
        note: 'חיבור לקבלת נתוני הוצאות פרסום, והמרות. לדיווח מדוייק למערכת',
        tone: 'meta'
    })
}

function editGoogleCalendarIntegration() {
    editIntegration({
        provider:AppIntegration.GOOGLE_CALENDAR,
        provider_name: getAppIntegrationName(AppIntegration.GOOGLE_CALENDAR),
        icon: 'fa-brands fa-google',
        description: 'סנכרון פגישות והזמנות עם היומן העסקי שלך',
        url: 'https://calendar.google.com/',
        note: 'החיבור מתבצע דרך חשבון Google ויאפשר סנכרון של יומן העבודה.',
        tone: 'google'
    })
}

function editGoogleAdsIntegration() {
    editIntegration({
        provider: AppIntegration.GOOGLE_ADS,
        provider_name: getAppIntegrationName(AppIntegration.GOOGLE_ADS),
        icon: 'fa-brands fa-google',
        description: 'ניהול קמפיינים ומעקב אחר תוצאות הפרסום',
        url: 'https://ads.google.com/',
        note: 'החיבור מתבצע באתר Google Ads ויאפשר לך לנהל את הקמפיינים העסקיים שלך.',
        tone: 'google'
    })
}

async function doIntegration(integration){
    const btn = document.getElementById("integrationApp")
    btn.disabled = true
    const html = btn.innerHTML
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`

    const data = {action:ApiCall.integration, integration:integration}
    const toast = showToast("מאמת..")
    await apiPost(ApiRoute.integrations, data).then(res=>{
        if (!res.success||!res.redirect){
            showToast(res.notice, ToastStat.ERROR, toast)
            btn.disabled = false
            btn.innerHTML = html
            return
        }
        console.log(res)
        window.open(res.redirect, "_blank", "noopener,noreferrer");

    })
}


/**
 * Toggle show ID on order
 */
function toggleShowIdOnOrder() {
    const showVatCodeOnOrder = document.getElementById('showVatCodeOnOrder');
    showVatCodeOnOrder.checked = c_runtime.company.show_vat_code_order

}
function setupEditHandlers() {
    const settingsPage = document.getElementById("SETTINGS");
    if (!settingsPage) return;

    // Logo upload
    const logoInput = document.getElementById("setLogo");
    if (logoInput) {
        logoInput.addEventListener("change", async () => {
            const file = logoInput.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast('יש להעלות קובץ תמונה', ToastStat.ERROR);
                return;
            }

            if (file.size > c_settings.max_size_logo) {
                showToast('גודל הקובץ גדול מדי', ToastStat.ERROR);
                return;
            }

            const toast = showToast("מעלה תמונה...");
            try {
                await uploadImage(file, "nullptr", ApiUploadFile.LOGO);
                showToast("לוגו עודכן!", ToastStat.DONE, toast);
            } catch (err) {
                showToast('שגיאה בהעלאה', ToastStat.ERROR, toast);
            }
            logoInput.value = '';
        });
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    await fetchMyManager();
    await fetchMyCompany();
    onLoadSetttings()
    setupEditHandlers()

});