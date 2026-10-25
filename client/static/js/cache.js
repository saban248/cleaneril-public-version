const KEYS = {
    dregister:1,
    exist:2,
    main_page:3,
    current_page:4,
    funds_charts:5,
    order_filter_stat:6
}

class ManagerCache{

    static create_cache(){
        if (ManagerCache.exist())return;
            localStorage.setItem(KEYS.exist,'1')
    }
    static managerPage(){
        const page =  localStorage.getItem(KEYS.current_page)
        if (!page)return -1;
        return parseInt(page)
    }
    static setManagerPage(tab){
        if (!ManagerCache.exist())return
        localStorage.setItem(KEYS.current_page, tab);
    }
    static setFundsChartsYear(year){
        if (!localStorage.getItem(KEYS.funds_charts)){
            localStorage.setItem(KEYS.funds_charts, "{}")
        }
        const funds_charts = localStorage.getItem(KEYS.funds_charts)
        const data = JSON.parse(funds_charts)
        data.year = year
        localStorage.setItem(KEYS.current_page, JSON.stringify(data))
        
    }
    static getFundsChartsYear(){
        const data = localStorage.getItem(KEYS.funds_charts)
        if (data == undefined || data == '{}'){return 2026}
        return JSON.parse(data).year
    }
    static setClientsSortedState(state){
        localStorage.setItem(KEYS.order_filter_stat, state)
    }
    static getClientsSortedState(){
        const data = localStorage.getItem(KEYS.order_filter_stat)
        if (data == undefined || data == null)return StateOrder.CANCELED|StateOrder.CLOSED|StateOrder.WAIT|StateOrder.DONE
        return parseInt(data, 10)
    }

    static exist(){
        return Boolean(localStorage.getItem(KEYS.exist));
    }
    static createRegsiterHistory(){
        const data = {}
        for (let [fname, flag] of Object.entries(RegisterApi)){
            data[flag] = {}
        }
        localStorage.setItem(KEYS.dregister,JSON.stringify(data))
    }
    static deleteRegisteristory(){
        localStorage.removeItem(KEYS.dregister)
    }
    static getRegisterHistory(__again = false){
        const data = localStorage.getItem(KEYS.dregister)
        if (!data && !__again){
            ManagerCache.createRegsiterHistory()
            return ManagerCache.getRegisterHistory(true)
        }
        return JSON.parse(data)
    }
    static setRegisterHisotry(level, dany){
        const data = ManagerCache.getRegisterHistory()
        data[level] = {...dany}
        localStorage.setItem(KEYS.dregister, JSON.stringify(data))
    }

}



ManagerCache.create_cache()