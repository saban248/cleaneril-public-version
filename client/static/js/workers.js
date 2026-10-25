c_workers = {
    edit:false,
    view:false,
    new:false
}


function getWorkerByWorkerId(wid){
    return c_runtime.workers.find(w => w.employee_id == wid)
}

function showDashbaordWorker(){
    const mainEdit = document.getElementById("worker-editor")
    mainEdit.classList.add("show")
}
function closeDashboardWorker(){
    const mainEdit = document.getElementById("worker-editor")
    mainEdit.classList.remove("show")   

    c_workers.edit = false;
    c_workers.view = false;
    c_workers.new = false;
    c_runtime.currentWorkerIdView = null;
}

function createEmployee(worker_id=null){
    showDashbaordWorker();

    const toast = showToast("מעבד...")
    data = {action:ApiCall.worker_editor, wid:worker_id}
    apiPost(ApiRoute.api, data).then(
        (res) => {
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
                return
            }

            const editBody = document.getElementById('worker-template')
            editBody.innerHTML = res.template;
            if (c_workers.edit || !worker_id){
                onLoadEditWorker();
            }
            c_runtime.currentWorkerIdView = worker_id;
            c_workers.new = true;
            c_workers.edit = true;
            showToast(res.notice, ToastStat.DONE, toast);
            
        }
    )
    
}


async function closeCreateWorker(){
    if (c_workers.new){
        await deleteWorker()
    }
    closeDashboardWorker();
   

}



async function deleteWorker(worker_id = c_runtime.currentWorkerIdView){
    const ok = await showAsk({msg:message.WdeleteWorker})
    if (!ok)return;

    data = {wid:worker_id, action:ApiCall.worker_delete}
    apiPost(ApiRoute.api,data).then(
        (res) =>{
            if (!res.success || res.deleted){
                return
            }
            document.getElementById(worker_id)?.remove();

        }
    )
}

function onLoadEditWorker(){
}


function setPermissionWorker(t, editor=true){
    if (editor == 'False')return
    const perms = mPermissions[t.id];
    if (perms == undefined)return

    const icon = t.children[0];
    const psClass = "permission-selected"
    const psvClass = psClass+"-v"
    const lastSelected = document.querySelectorAll("."+psClass)[0]
    const about = document.getElementById("i"+t.id)
    if (icon.classList.contains(psClass)){
        icon.classList.remove(psClass);
        t.children[1]?.remove();
        about.classList.remove("show")
        return
    }
    about.classList.add("show")
    if (lastSelected){
        setPermissionWorker(lastSelected.parentElement)
    }
    icon.classList.add(psClass);
    const iconV = document.createElement("i");
    iconV.classList = "fa-solid fa-circle-check "+psvClass
    t.appendChild(iconV)   
}



function viewEmployeeDetails(employeeId){
    const mainEdit = document.getElementById("worker-editor")
    mainEdit.classList.add('show');

    data = {action:ApiCall.worker_view, wid:employeeId}
    const toast = showToast("מעבד...");
    apiPost(ApiRoute.api, data).then(
        (res) => {
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
                return
            }
            c_runtime.currentWorkerIdView = employeeId;
            c_workers.view = true;
            const editBody = document.getElementById('worker-template')
            editBody.innerHTML = res.template;
            showToast(res.notice, ToastStat.DONE, toast);
        }
    )
}

function publishWorker(employeeId){
    const username = document.getElementById("wname").value;
    const password = document.getElementById("wpassword").value;
    const phone = document.getElementById("wphone").value;
    const idc = document.getElementById("widc").value.replace(/\D+/g, '');
    const permission = mPermissions[document.querySelectorAll(".permission-selected")[0].parentElement.id]
    const profitSharing = document.getElementById("wps").value; 
    const payVat = document.getElementById("wpvat").checked;

    const data = {action:ApiCall.worker_save, e_name:username,e_pwd:password,e_phone:phone,e_idc:idc,permission:permission,
        wid:employeeId,ps:profitSharing,pvat:payVat
    }
    const toast = showToast("מעבד...");
    apiPost(ApiRoute.api,data).then(
        (res)=>{
            if (!res.success){
                showToast(res.notice, ToastStat.ERROR, toast);
                return
            }

            showToast(res.notice, ToastStat.DONE, toast);
        }
    )

}

function editExistWorker(employeeId){
    CONFIG.WORKER_EDIT = true;
    createEmployee(employeeId)
}


const menuItemsWorker = [
    { text: "צפיה", action: (wid) => viewEmployeeDetails(wid), icon:'<i class="fa-solid fa-eye"></i>'},
    { text: "עריכה", action: (wid) => editExistWorker(wid), icon:'<i class="fa-solid fa-pencil"></>'},
    { text: "מחיקה", action: (wid) => deleteWorker(wid), icon:'<i class="fa-solid fa-trash-can trash"></i>'},

]

function openMenuWorker(t, wid){
    const menu = document.getElementById("workerMenu")

    if (menu.classList.contains("show")) {
        menu.classList.remove("show")
        return
    }
    const rect = t.getBoundingClientRect()
    menu.innerHTML = "" // ניקוי

    menuItemsWorker.forEach(item => {
        let cma = document.createElement("div")
        cma.className = "cma"
        let cma1 = document.createElement('div')
        cma1.className = "cma1"
        cma1.innerHTML = item.icon
        
        let cma2 = document.createElement("div")
        cma2.className = 'cma2'
        cma2.textContent = item.text
        cma.appendChild(cma1)
        cma.appendChild(cma2)

        cma.onclick = () => {
            item.action(wid)
            menu.classList.remove("show")
        }
        menu.appendChild(cma)
    })

    menu.style.top = `${rect.bottom + window.scrollY + 6}px`
    menu.style.left = `${rect.left + window.scrollX}px`

    menu.classList.add("show")
}

document.addEventListener("click", e => {
    const menu = document.getElementById("workerMenu")
    if (!menu.contains(e.target) && !e.target.classList.contains("menu-client")) {
        menu.classList.remove("show")
    }
})