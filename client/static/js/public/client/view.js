


async function loadClientOrderDetails(){
    const params = new URLSearchParams(window.location.search); 
    if (!params.get("oi")||!params.get("koi")){
        showToast(message.EInvalidPublicOrderView, ToastStat.ERROR)
        return
    }
    const parent = document.getElementById("the-client-card");
    const data = {action:PublicApi.viewCleanOrder, ...Object.fromEntries(params)}
    console.log(data)
    const res = await apiPost(ApiRoute.papi, data);
    if (!res || !res.success){
        showToast(res.notice, ToastStat.ERROR)
        return
    }
    parent.innerHTML = res.template;
    parent.classList.add("show")

}


document.addEventListener("DOMContentLoaded", async ()=>{
    await loadClientOrderDetails()
})