

function renderLiveTransaction(transaction){
    const icon = getOrderStatIcon(transaction.stat)
    const statText = getOrderStatText(transaction.stat)
    const orderType = getCleanOrderTypeText(transaction.order_type)
    const [text,ish] = getFeeTypeIconText(FeeTypes.CASH);
    return `
    <div class="lt-item" id="trnasaction-${transaction.key}">
        <div class="transaction-type avatar client-state-${transaction.stat}">
            <i class="${icon}" data-label="${statText}"></i>
        </div>
        <div class="lti-body">
            <span class="lti-name">עיסקה ${orderType}, ${transaction.value}${ish}</span>
        </div>
    </div>
    `

}
async function renderBoxLiveTransactions(){

    return`
    <div class="box-live-transactions">
        <div class="mlt-menu">
            <div class="mltm-item-title">
                <span>עסקאות גלובליות</span>
            </div>
            <div class="mltm-item-live">
                <span>${getMoneyValueFormat(c_market.transactions.transactions_value)}</span>
                <i class="fa-solid fa-coins"></i>
            </div>
        </div>
        <div class="lt-body">
        ${
            (await Promise.all(
            c_market.transactions.array.map(t => renderLiveTransaction(t))
            )).join("") || '<div class="mlt-empty">אין כרגע עסקאות ברשת </div>'
        }
        </div>
    </div>`
}

async function initLiveTransactions() {
    const parent = document.getElementById("liveTransactions")
    const livet = await renderBoxLiveTransactions()

    parent.innerHTML = livet;

}

