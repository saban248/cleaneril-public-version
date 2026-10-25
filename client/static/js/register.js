var isMobile = window.innerWidth <= 768;
const debug = false;
const c_register = {
    subscription_plan: null,
    subscription_type: UserAccountSubscription.MONTHLY,
}
const LEVELS = {
    AUTH:1,
    PHONE_OTP:2,
    COMPANY:3,
    LOGO:4,
    SUBSCRIPTION:5,
    FINISH:6
}
var currentLevel = LEVELS.AUTH;



function continueToLevel(){
    const currentLeft = document.getElementById("llevel-"+currentLevel);
    const currentRight = document.getElementById("rlevel-"+currentLevel);
    currentLeft.classList.remove("show");
    currentRight.classList.add("show");
}

function welcomeForContinue(){
    if (window.location.pathname == PageRoute.auth)return
    if (!isMobile){
        showSpecificLevel(currentLevel)
        return
    }
    const currentLeft = document.getElementById("llevel-"+currentLevel);
    const currentRight = document.getElementById("rlevel-"+currentLevel);
    currentLeft?.classList.add("show");
    currentRight?.classList.remove("show");
}
function showSpecificLevel(level){
    const currentRight = document.getElementById("rlevel-"+currentLevel);
    const currentLeft = document.getElementById("llevel-"+currentLevel);
    const nextLeft = document.getElementById("llevel-"+level);
    const nextRight = document.getElementById("rlevel-"+level);

    currentLeft?.classList.remove("show")
    currentRight?.classList.remove("show")
    nextLeft?.classList.add("show")
    nextRight?.classList.add("show")
}

function completeRegsiterLevel(level){
    showSpecificLevel(level+1);
    currentLevel = level+1;
    welcomeForContinue()
}

function redirect(path){
    location.href = "/"+path;
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
function completeFromCacheHistory(){
    const cahceData = ManagerCache.getRegisterHistory()
    // level 2
    ld2 = cahceData[RegisterApi.level2]
    if (Object.keys(ld2).length != 0){
        const ovc = document.getElementById('ownerVATCode');
        if (!ovc)return
        ovc.value = ld2.vc;
        document.getElementById("onwerName").value = ld2.fn;
        document.getElementById("onwerPhone").value = ld2.op;
        document.getElementById("companyPhone").value = ld2.cp;
        document.getElementById("companyDesc").value = ld2.d;
        document.getElementById("companyName").value = ld2.cn
    }


}
function doRegister(t){
    if (debug){completeRegsiterLevel(LEVELS.AUTH)}

    const o_phone = document.getElementById("onwerPhone").value;
    const pwd1 = document.getElementById("pwd1").value;
    const pwd2 = document.getElementById("pwd2").value;
    const csrf = document.getElementById("cXsXrF");
    if (pwd1!==pwd2){
        showToast("הסיסמאות לא תואמות", ToastStat.ERROR);
        return;
    }
    onApiCall(t)
    const data = {action:RegisterApi.level0, o_phone:o_phone, password:pwd1, xCSRF:csrf.value}
    apiPost(ApiRoute.register, data).then(
        res =>{
            if (!res.success){
                if (res.code == CODES.reachhOtpLimit){
                    showToast(`אנא המתן ${res.cooldown} דקות`, ToastStat.ERROR)
                    
                }else{
                    showToast(res.notice, ToastStat.ERROR)
                }
            }
            else{
                const level = res.level?res.level:LEVELS.AUTH
                completeRegsiterLevel(level)
                const counterSms = document.getElementById("counterSms")
                createCountdown(counterSms, 60)
                csrf.value = res.mid;
            }
            onApiCall(t, true)
            showToast(res.notice, ToastStat.DONE)
        }
    )
}


function doOtp(t){
    if (debug){completeRegsiterLevel(LEVELS.PHONE_OTP);}
    const o_phone = document.getElementById("onwerPhone").value;
    const pwd1 = document.getElementById("pwd1").value;
    const otp = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
    const csrf = document.getElementById("cXsXrF").value;
    
    const toast = showToast("מאמת...", ToastStat.INFO);
    if (otp.length < 6) {
        showToast("נא להזין קוד מלא", ToastStat.ERROR, toast);
        return;
    }

    onApiCall(t);
    apiPost(ApiRoute.register, {action: RegisterApi.level1, otpcode: otp, o_phone: o_phone,
        password:pwd1, mid: csrf}).then(res => {
        onApiCall(t, true);
        if (!res.success) {
            showToast(res.notice, ToastStat.ERROR, toast);
            return;
        }
        showToast("הקוד אומת בהצלחה!", ToastStat.DONE, toast);
        completeRegsiterLevel(LEVELS.PHONE_OTP);
    });
}

function doCompany(t){
    if (debug){completeRegsiterLevel(LEVELS.COMPANY);}
    const vatCode = document.getElementById("ownerVATCode").value;
    const fullname = document.getElementById("onwerName").value;
    const onwerPhone = cleanPhoneJustNumbers(document.getElementById("onwerPhone").value);
    const companyPhone = cleanPhoneJustNumbers(document.getElementById("companyPhone").value);
    const companyName = document.getElementById("companyName").value;
    const desc = document.getElementById("companyDesc").value;
    const csrf = document.getElementById("cXsXrF").value;

    if (!isValidIsraeliID(vatCode)){
        showToast("מספר עוסק / ת.ז לא תקין", ToastStat.ERROR)
        return;
    }
    if (!isValidPhone(onwerPhone) || (companyPhone != '' && !isValidPhone(companyPhone))){
        showToast("מספר הפלאפון לא תקין", ToastStat.ERROR)
        return;
    }

    if (companyName.split(/\s+/).length < 2){
        showToast("העסק חייב להכיל 2 מילים", ToastStat.ERROR)
        return;
    }

    const descWords = desc.split(/\s+/)
    if (descWords.length < 3 || descWords.length > 4){
        showToast("תיאור העסק לא תקין", ToastStat.ERROR)
        return;
    }
    ManagerCache.setRegisterHisotry(RegisterApi.level2, {
        vc:vatCode,
        fn:fullname,
        op:onwerPhone,
        cp:companyPhone,
        cn:companyName,
        d:desc

    })

    onApiCall(t)
    const data = {action:RegisterApi.level2, c_phone:companyPhone,o_phone:onwerPhone, c_name:companyName, c_desc:desc, mid:csrf, o_name:fullname,
        vat_code:vatCode
    }
    apiPost(ApiRoute.register, data).then(
        res =>{
            onApiCall(t, true)
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR);
                return
            }
            completeRegsiterLevel(LEVELS.COMPANY)
        }
    )
}




function setLogo() {
    const input = document.getElementById("setLogo");
    input.click();
}

function doLogo(t){
    if (debug){completeRegsiterLevel(LEVELS.LOGO);}
    const img = document.getElementById('setLogo');
    const csrf = document.getElementById("cXsXrF").value;
    const file = img.files[0];
    const toast = showToast("מעלה לוגו...");
    const reader = new FileReader();
    reader.onload = function () {
        const base64Data = reader.result.split(",")[1];
        apiPost(ApiRoute.register, {
            filename:'ok',
            action:RegisterApi.level3,
            data: base64Data
        }).then(res => {
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast)
                return;
            }
            showToast("הלוגו הועלה בהצלחה", ToastStat.DONE, toast)
            completeRegsiterLevel(LEVELS.LOGO);
            onApiCall(t,true)

        });
    };
    if (!file){
        showToast("נא לבחור לוגו", ToastStat.ERROR, toast)
        return;
    }
    reader.readAsDataURL(file);
}




function uploadImage(t, file, name, action, mid, callback) {
    if (!file)return;
    uploadImageFile(file, {filename:name, action:action, mid:mid}, res => {
        if (!res.success){
            showToast("העלאת התמונה נכשלה")
            onApiCall(t,true)
            return;
        }
        if (action == ApiUploadFile.LOGO){
            callback()
        }
    });
}
/**
 * Select subscription plan (FREE or PREMIUM)
 */
function selectPlan(plan, element) {
    c_register.subscription_plan = plan;
    document.querySelectorAll('.plan-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    for (const [t, k] of Object.entries(UserAccountSubscription)){
        if (k == plan){
            const listFeature = document.querySelector(`.plan-card[data-subplan='${plan}'] ul`);
            for (el of listFeature.children) {
                el.classList.remove('is-visible');
            }
        }
    }
 
    const featuresList = element.querySelector('.plan-features');
    if (featuresList) {
        const items = Array.from(featuresList.children);
        items.forEach((item, index) => {
            setTimeout(() => item.classList.add('is-visible'), 190 * (index + 1));
        });
    }
    updateContinueButtonText();
}

function updatePlanPricing() {
    const price = 20
    const thePlanPrice = document.getElementById("thePlanPrice");
    switch (c_register.subscription_type) {
        case subscriptionType.MONTHLY:
            thePlanPrice.textContent = `${price}`;
            break;
    
        case subscriptionType.YEARLY:
            thePlanPrice.textContent = `${price*12}`;
            break;
    }
}

function updateContinueButtonText() {
    const continueFromSubscription = document.getElementById("continueFromSubscription");
    if (c_register.subscription_plan === UserAccountSubscription.FREE) {
        continueFromSubscription.textContent = `המשך לחשבון רגיל `;
    } else if (c_register.subscription_plan === UserAccountSubscription.PREMIUM) {
        continueFromSubscription.textContent = `המשך לחשבון פרימיום`;
    }
}

/**
 * Select subscription type (MONTHLY or YEARLY)
 */
function selectSubscriptionType(sub_type) {
    c_register.subscription_type = sub_type;
    document.querySelectorAll('.billing-pill').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtype == sub_type);
    });
    updatePlanPricing();
}

/**
 * Complete subscription selection and continue
 */
async function doSubscription() {    
    if (!c_register.subscription_plan) {
        showToast('בחר תוכנית הרשמה', ToastStat.ERROR);
        return;
    }
    const data = {
        action: RegisterApi.level4,
        sub_plan: c_register.subscription_plan,
        sub_type: c_register.subscription_type
    }
    const toast = showToast("בתהליך..");
    const res = await apiPost(ApiRoute.register, data);
    if (!res.success) {
        showToast(res.notice, ToastStat.ERROR, toast);
        return;
    }
    closeToast(toast);
    completeRegsiterLevel(LEVELS.SUBSCRIPTION);
    showToast("ההרשמה הושלמה בהצלחה!", ToastStat.DONE);

}



function renderPlanFeatures(container, plan) {
    if (!container) return;

    container.innerHTML = '';

    for (const feature of getPlanSubsFeatures(plan)) {
        const li = document.createElement("li");
        const icon = document.createElement("i");
        const span = document.createElement("span");
        icon.className = feature.text.icon;
        span.textContent = feature.text.title;
        li.appendChild(icon);
        li.appendChild(span);
        container.appendChild(li);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const listPremiumFeature = document.getElementById("listPremiumFeature");
    const listFreeFeature = document.getElementById("listFreeFeature");

    renderPlanFeatures(listFreeFeature, SubscriptionPlanFree);
    renderPlanFeatures(listPremiumFeature, SubscriptionPlanPremium);
    updatePlanPricing();
    selectSubscriptionType(subscriptionType.MONTHLY);
    selectPlan(UserAccountSubscription.PREMIUM, document.querySelector(`.plan-card[data-subplan="${UserAccountSubscription.PREMIUM}"]`));
    selectPlan(UserAccountSubscription.FREE, document.querySelector(`.plan-card[data-subplan="${UserAccountSubscription.FREE}"]`));


})



document.addEventListener("DOMContentLoaded", function (){
    const pass=document.getElementById("pwd1")
    const bar=document.getElementById("bar")
    pass?.addEventListener("input",()=>{
        let v=pass.value
        let s=0
        if(v.length>5) s+=25
        if(/[A-Z]/.test(v)) s+=25
        if(/[0-9]/.test(v)) s+=25
        if(/[^A-Za-z0-9]/.test(v)) s+=25
        bar.style.width=s+"%"
        if(s<=25) bar.style.background="red"
        else if(s<=50) bar.style.background="orange"
        else if(s<=75) bar.style.background="gold"
        else bar.style.background="limegreen"
    })
    const input = document.getElementById("setLogo")
    const img = document.getElementById("logoView")

    input?.addEventListener("change", () => {
        const file = input.files[0]
        if (file) {
            img.src = URL.createObjectURL(file)
        }
    })

    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.data && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').slice(0, 6).split('');
            pasteData.forEach((char, i) => {
                if (otpInputs[i]) otpInputs[i].value = char;
            });
            const nextFocus = Math.min(pasteData.length, otpInputs.length - 1);
            otpInputs[nextFocus].focus();
        });
    });

    const media = window.matchMedia("(max-width: 768px)");
        media.addEventListener("change", (e) => {
            isMobile = e.matches;
            welcomeForContinue()

    });
    completeFromCacheHistory()
    welcomeForContinue();
    
}
)
