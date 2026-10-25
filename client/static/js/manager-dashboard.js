function switchPageManager(page){
    closeMenuTabsDashboard()
    var last_page = ManagerCache.managerPage();
    if (last_page == -1){
        last_page = PageManager.CLIENTS
    }
    const lp = document.getElementById(getPageManager(last_page));
    if (lp) lp.classList.remove("show");

    const _page_ = document.getElementById(getPageManager(page));
    if (!_page_)return
    _page_.classList.add("show")
    ManagerCache.setManagerPage(page)
    window.dispatchEvent(
        new CustomEvent("switchPage", {
            detail: {
                page: page
            }
        })
    );
}



function createCard(card_id=null){
    const mainEdit = document.getElementById("card-editor")
    mainEdit.classList.remove('hide');
    mainEdit.classList.add('show');
    const toast = showToast("מעבד...")
    const data = {action:ApiCall.card_editor, ci:card_id}
    apiPost(ApiRoute.api, data).then(
        (res) => {
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast)
                return
            }

            const editBody = document.getElementById('card-template')
            editBody.innerHTML = res.template;
            showToast(res.notice, ToastStat.DONE, toast);
        }
    )

}

function closeCreateCard(no_api=false){
    const mainEdit = document.getElementById("card-editor")
    mainEdit.classList.remove("show")
    mainEdit.classList.add("hide")
    const card_id   = document.getElementById("the-card").dataset.ci;
   ( !no_api && !CONFIG.CARD_EDIT)&& deleteCard(card_id)
   CONFIG.CARD_EDIT =false;
}


async function publishCard(state_card=ApiCall.card_save){
    const card_id   = document.getElementById("the-card").dataset.ci
    const card_title = document.getElementById("card-title").value
    const fileInput = document.getElementById("imgInput");
    let file = fileInput.files[0];
    var filename = null;
    if (!file){
        const src = document.getElementById("previewImg").src;

        // Fetch the image data from the src
        const res = await fetch(src);
        const blob = await res.blob();

        // Create File object from Blob
        const a = src.split(".")
        const eof = a[a.length-1]
        file = new File([blob], card_id+"."+eof, { type: blob.type });
        filename = file.name;
    }
    else{
        filename = card_id+"."+file.name.split(".")[file.name.split(".").length-1]
    }

    const whatsapp = document.getElementById("whatsapp-text").value
    let off_price = parseInt(document.getElementById("off-price").value)
    if (!off_price){
        off_price = 0
    }
    const data = {
        action:state_card,
        ci:card_id,
        ct:card_title,
        wt:whatsapp,
        o:1?off_price!=0:0,
        op:off_price,
        imp:filename
    }
    uploadImage(file, filename, ApiUploadFile.CARD);
    const toast = showToast("מעבד..")
    apiPost(ApiRoute.api, data).then(
        (res) =>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
            }
            closeCreateCard(true)
            showToast(res.notice, ToastStat.DONE, toast);
        }
    )

}


function draftCard(){
    publishCard(ApiCall.card_draft)
}

async function deleteCard(card_id){
    const ok = await showAsk({msg:message.WdeleteCard})
    if (!ok)return;
    
    const data = {ci:card_id, action:ApiCall.card_delete}
    apiPost(ApiRoute.api,data).then(
        (res) =>{
            if (!res.success || res.deleted){
                return
            }
            document.getElementById(card_id)?.remove();

        }
    )


}

function editExistCard(card_id){
    CONFIG.CARD_EDIT = true;
    createCard(card_id)
}


function triggerFileSelect() {
    document.getElementById("imgInput").click();
}

function setImage(input, imgTagId) {
    const file = input.files[0];
    if (!file) return;

    const img = document.getElementById(imgTagId);
    img.src = URL.createObjectURL(file);
}



function openMenuTabsDashboard(t){
    showMenuGeneralItems(t)
    const iconMenuO = document.getElementById("mtdasboard-open");
    const iconMenuC = document.getElementById("mtdasboard-close");
    iconMenuO.style.display = 'none';
    iconMenuC.style.display = 'inline-flex';
}

function closeMenuTabsDashboard(){
    
    const iconMenuO = document.getElementById("mtdasboard-open");
    const iconMenuC = document.getElementById("mtdasboard-close");
    iconMenuO.style.display = 'inline-flex';
    iconMenuC.style.display = 'none';
    const menu = document.getElementById("generalMenu")
    menu.classList.remove("show")
    const mMaster = document.getElementById("menuMaster")
    mMaster.style.transform = ``;
    mMaster.style.top = `-10px`;
    mMaster.classList.remove("open")
}

const GeneralMenuitems = [
    { text: "עובדים", action: (p) => switchPageManager(PageManager.WORKERS), icon:'<i class="fa-solid fa-users"></i>'},
    { text: "קבלות", action: (p) => switchPageManager(PageManager.INVOICES), icon:'<i class="fa-solid fa-file-invoice"></i>'},
    { text: "מנויים", action: (p) => switchPageManager(PageManager.SUBSCRIPTIONS), icon:'<i class="fa-solid fa-crown"></i>', flag:ManagerPermissions.ROOT},
    { text: "יציאה", action: (p) => doLogout(), icon:'<i class="fa-solid fa-person-walking-arrow-right"></i>'},

]
function showMenuGeneralItems(t){
    const menu = document.getElementById("generalMenu")
    const mMaster = document.getElementById("menuMaster")

    if (menu.classList.contains("show")) {
        menu.classList.remove("show")
        return
    }
    menu.innerHTML = "";
    let y = 0;
    GeneralMenuitems.forEach(item => {
        if (item.flag && (c_runtime.currentUPermission < item.flag)){
            return
        }
        let cma = document.createElement("div")
        cma.className = "master-menu-item"
        let cma1 = document.createElement('div')
        cma1.className = "cma1"
        cma1.innerHTML = item.icon
        
        let cma2 = document.createElement("div")
        cma2.className = 'cma2'
        cma2.textContent = item.text
        cma.appendChild(cma1)
        cma.appendChild(cma2)

        cma.onclick = () => {
            item.action(item.text)
            menu.classList.remove("show")
        }
        menu.appendChild(cma)
        y += 40;
        mMaster.style.top = `-${y}px`;
        
    })

    // ברירת מחדל – למטה

    menu.classList.add("show")
    mMaster.classList.add('open')
}




document.addEventListener("DOMContentLoaded", function(){
    switchPageManager(ManagerCache.managerPage())
})
