function doLogin(t){
    onApiCall(t)
    const phone = document.getElementById('phone');
    const password = document.getElementById("password");
    if (!phone.value || !password.value){
        showToast(message.Elogin||"משהו השתבש", ToastStat.ERROR);
        onApiCall(t, true)
        return;
    }
    const data = {phone:phone.value, password:password.value}
    const toast = showToast("נכנס..", ToastStat.LOAD)

    apiPost(ApiRoute.auth, data).then(
        (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast)
            }
            if (res.code == CODES.registerNotFinished){
                setTimeout(()=>location.href = PageRoute.createAccount, 1600);
                return
            }
            onApiCall(t, true)
            location.href = '/dashboard'
        }
    )
}
function doLogout(){
    const toast = showToast(message.Ilogout)
    setTimeout(() => apiPost(ApiRoute.logout).then(
        (res) => {
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR);
                return
            }
            location.reload()
        }
    ), 1000)
}

async function doAlive(){
    const intervalMs = 60 * 1000;

    if (doAlive.timerId)return;

    async function sendAlive(){
        if (doAlive.isSending)return;
        doAlive.isSending = true;

        try {
            const res = await apiPost(ApiRoute.api, {action:ApiCall.alive});
            if (!res.success){
                clearInterval(doAlive.timerId);
                doAlive.timerId = null;
                location.href = '/auth';
                return false;
            }
        } catch (err) {
        } finally {
            doAlive.isSending = false;
        }
        return true;
    }

    const aliveOk = await sendAlive();
    if (!doAlive.timerId){
        doAlive.timerId = setInterval(sendAlive, intervalMs);
    }
}



