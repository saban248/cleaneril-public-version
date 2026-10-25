const ShareAppTypes = {
    ORDER_PHOTO: 1,
    ORDER_LINK: 2
};  

const mainShareData = {
    title:'',
    text:'',
    files:[]
}


function canvasToBlob(canvas, type = "image/png", quality = 1) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to create blob"));
            }
        }, type, quality);
    });
}

async function initShareOrder(shareType) {
    const order = get_order_by_order_id(c_runtime.currentOrderIdView);
    mainShareData.title = `הזמנת ${getCleanOrderTypeText(order.order_type)}`;
    mainShareData.text =  getTtextShareCleanOrder(order.order_type, order.date*1000);
    mainShareData.files = []
    await shareOrderToClientAsPhoto(`${order.order_id}`)
    const content = `
    <div class="share-order-to-client">
        <div class="share-app">
            <div class="share-app-item" onclick="doNavigate(this, ${ShareAppTypes.ORDER_PHOTO})">
                <span>שיתוף תמונה</span>
                <i class="icon icon-48">${await icon("picture")}</i>
            </div>
            <div class="share-app-item" onclick="doNavigate(this, ${ShareAppTypes.ORDER_LINK})">
                <span>שיתוף קישור</span>
                <i class="icon icon-48">${await icon("connection")}</i>
            </div>
        </div>
    </div>`;
    createEditModal("שיתוף הזמנה ללקוח",null, null, {content:content, save:false});
    
}

async function shareOrderToClientAsPhoto(oid = c_runtime.currentOrderIdView) {
    if (isCantExitEditOrder()){
        if (!(await askAboutExitEditOrder())){return}
    }

    await showClientOrder(oid);
    const orderElement = document.getElementById('the-client-card');
    if (!orderElement) {
        showToast(message.ETemplateOrderFailed, ToastStat.ERROR);
        return 1
    }
    try {
        if (!mainShareData.files.length == 0)return 0
        const canvas = await html2canvas(orderElement, {
            scale: 2,
            allowTaint: true,
            useCORS: true,
            logging: false
        });

        const blob = await canvasToBlob(canvas);
        if (!blob) {
            showToast(message.ECreateOrderImgFailed, ToastStat.ERROR);
            return 1
        }
        const fileName = `order_${oid}.png`;
        mainShareData.files.push(new File([blob], fileName, { type: "image/png" }));
        try {
            if (!navigator.canShare || !navigator.canShare(mainShareData)) {
                showToast(message.EShareOrderFailed, ToastStat.ERROR);
                return 1
            }
        } catch (shareErr) {
            showToast(shareErr.message, ToastStat.ERROR);
            return 1
        }

    } catch (err) {
        showToast(message.EShareOrderFailed, ToastStat.ERROR);
        return 1
    }
    showToast("מוכן לשיתוף", ToastStat.DONE);
    return 0
}

async function doNavigate(t, typeShare){
    let stat = 1
    switch (typeShare) {
        case ShareAppTypes.ORDER_PHOTO:
            
            stat = await shareOrderToClientAsPhoto(c_runtime.currentOrderIdView, c_runtime.currentClientIdView);
            break;
    
        case ShareAppTypes.ORDER_LINK:
            stat = createLinkClientOrder()
            break;
    }
    if (stat){
        return
    }
    if (!navigator.share){
        showToast(message.EShareOrderFailed, ToastStat.ERROR);
        return
    }
    try {
        await navigator.share(mainShareData);
        closeEditModal()
    } catch (shareErr) {
        console.error("Sharing failed:", shareErr);
        if (shareErr?.name !== "AbortError"){
            showToast(message.EShareOrderFailed, ToastStat.ERROR);
        }
    }
}




function downloadFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}