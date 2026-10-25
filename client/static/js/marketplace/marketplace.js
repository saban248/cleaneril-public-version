

/** MAIN */
window.addEventListener("DOMContentLoaded", function(){
    window.addEventListener("switchPage", async (e) =>{
        if (e.detail.page == PageManager.MARKETPLACE){
            await fetchAvailablJobs()
            await fetchTransactions()
            
            await initLiveShareJob()
            await initLiveMapShareJob()
            await initLiveTransactions()
        }
    })
})
