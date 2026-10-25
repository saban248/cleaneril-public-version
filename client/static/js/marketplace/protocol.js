const c_market = {
    availableJob:[],
    transactions:[],
    currentJobIdView:null,
    getAJById:(jib) =>{
        return c_market.availableJob.find(job => job.job_id == jib)
    },
    getAJByOI:(oid)=>{
        return c_market.availableJob.find(job => job.order_id == oid)
    },
    getRequestById:(jid, rid)=>{
        return c_market.availableJob.find(job => job.job_id == jid)?.requests.find(r => r.request_id == rid) ?? null
    }
}

const SectionMarketView = {
    LIVE_JOB:"liveShareJob",
    LIVE_JOB_MAP:"liveTransactionsMap",
    LIVE_TRANSACTIONS:"liveTransactions",
    JOB_DETAILS:"liveJobDetails"
}


const JobMarketplaceState = {
    DONE:1<<0,
    ESTABLISHED:1<<1,
    AVAILBALE:1<<2,
    SUSPENDED:1<<3,
}


function getTextJobMarketState(f){
    let text = ''
    if (f==JobMarketplaceState.DONE){
        text = 'העברה הושלמה'
    }
    else if (f == JobMarketplaceState.ESTABLISHED){
        text = 'בתהליך העברה'
    }
    else if (f == JobMarketplaceState.AVAILBALE){
        text = 'שלח בקשה'
    }
    else if (f == JobMarketplaceState.SUSPENDED){
        text = 'לא זמין'
    }


    return text;
}


const JobRequestState = {
    APPROVED:1 << 4,
    REJECTED:1 << 5,
    BLOCKED:1 << 6,
    WAIT:1 << 7,
    AVAILABLE:1<< 8
}


function getTextColorJobRequestState(f){
    let text = 'הבקשה '
    let color = 'black'
    if (f==JobRequestState.APPROVED){
        text += "אושרה"
        color = '#2c90a1'
    }
    else if (f==JobRequestState.REJECTED){
        text += "נדחתה"
        color = '#981b2c'
    }
    else if (f==JobRequestState.BLOCKED){
        text = "לא זמין יותר"
        color = 'gray'
    }
    else if (f==JobRequestState.WAIT){
        text += "בהמתנה"
        color = '#84a61d'
    }

    return[ text, color]
}


function getJobStateTextColor(f){
    switch (f) {
        case JobMarketplaceState.DONE:
            return ["הועבר בהצלחה", "#2c90a1"]
        case JobMarketplaceState.ESTABLISHED:
            return ["מעביר עבודה", "#84a61d"]
        case JobMarketplaceState.AVAILBALE:
            return ["זמין בשוק", "#0e7b20"]
        case JobMarketplaceState.SUSPENDED:
            return ["לא זמין בשוק", '#981b2c']
        case -1000:
            return ['הועבר אליך', '#5b3da7']
    }
}

