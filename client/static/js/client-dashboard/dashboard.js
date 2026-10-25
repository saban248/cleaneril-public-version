const c_c_dashboard = {
   enter:false,
   editor:false,
   newOrder:false,
   inOrder:false,
   inStm:false,
   currentDView:clientCardsView.ORDERS,
   lastDView:null,
   reset() {
      this.enter = false;
      this.editor = false;
      this.newOrder = false;
      this.inOrder = false;
      this.inStm = false;
      this.currentDView = clientCardsView.ORDERS;
      this.lastDView = null;
   }
}


function renderActionsOrder(){
   const show = (cond)=>cond?'show':''
   const order = get_order_by_order_id(c_runtime.currentOrderIdView)
   const isSharedWithMe = thisCleanOrderShareWithMe(order.order_id)
   const isShared = order.marketplace_shared;
   return`
   <i class="fa-solid fa-globe ${show(!c_c_dashboard.editor&&!isSharedWithMe)} ${isShared?'asotm-shared':''}"
   id="asotm"
   onclick="initShareOrderToMarketplace()"></i>

   <i class="fa-solid fa-xmark ${show(c_c_dashboard.editor)}"
   id="aceo"
   onclick="abortOrderEdit()"></i>

   <i class="fa-solid fa-arrow-up-from-bracket ${show(!c_c_dashboard.editor)}"
      id="asop"
      onclick="initShareOrder()"></i>

   <i class="fa-solid fa-pencil ${show(!isSharedWithMe&&!c_c_dashboard.editor)}"
      id="aeeo"
      onclick="editExistOrder()"></i>

   <i class="fa-solid fa-clone ${show(!c_c_dashboard.editor)}"
   id="adco"
   onclick="initDuplicateCleanOrder()"></i>

   <i class="fa-solid fa-trash-can ${show(!c_c_dashboard.editor)}"
      id="adoc"
      onclick="deleteOrderFromDashhbaord()"></i>

   <i class="fa-solid fa-user-xmark ctype-4 ${show(c_c_dashboard.editor)}"
      onclick="publisCleanOrderFromDashboard(StateOrder.CANCELED)"
      id="apcocan"></i>

   <i class="fa-solid fa-person-circle-question ctype-1 ${show(c_c_dashboard.editor)}"
      onclick="publisCleanOrderFromDashboard(StateOrder.WAIT)"
      id="apcow"></i>

   <i class="fa-solid fa-user-clock ctype-2 ${show(c_c_dashboard.editor)}"
      onclick="publisCleanOrderFromDashboard(StateOrder.CLOSED)"
      id="apcoc"></i>

   <i class="fa-solid fa-user-check ctype-8 ${show(c_c_dashboard.editor)}"
      onclick="publisCleanOrderFromDashboard(StateOrder.DONE)"
      id="apcod"></i>

   <i class="fa-solid fa-file-circle-plus ${show(!c_c_dashboard.editor)}"
      id="acoi"
      onclick="createReceiptFromDashbaord()"></i>
   `
}

function renderActionsReceipt(){
   const show = (cond)=>cond?'show':''
   const order = ClientStore.getOrder(c_runtime.currentOrderIdView);
   const receipt = getReceiptsByOrderId(c_runtime.currentOrderIdView);
   return `
   <i class="fa-solid fa-pencil"
   id="aero"
   onclick="editReceiptOrder()"></i>

   <i class="fa-solid fa-trash-can ${show(receipt)}"
      id="adro"
      onclick="deleteReceiptFromDashbaord()"></i>

   <i class="fa-solid fa-xmark"
      id="acero"
      onclick="closeEditReceiptOrder()"></i>

   <i class="fa-solid fa-arrow-up-from-bracket ${show(receipt)}"
   id="asrp"
   onclick="shareReceiptToClientAsPhoto()"></i>
   `
}

function renderClientDashboardMenuActions(){
   return `
   <div class="client-card-action" id="clientCardAViews">
      <i class="fa-solid fa-file-invoice show"
         onclick="switchViewClientDashboard(clientCardsView.ORDER)"
         id="cdv1"></i>

      <i class="fa-solid fa-receipt show"
         onclick="switchViewClientDashboard(clientCardsView.RECEIPT)"
         id="cdv2"></i>

      <i class="fa-solid fa-chart-column show"
         id="cdv4"
         onclick="switchViewClientDashboard(clientCardsView.REPORTS)"></i>
   </div>
   <div class="client-card-action" id="actionIntoCard">
      ${renderActionsOrder()}
      ${renderActionsReceipt()}
   </div>`

}
async function renderClientDashboard() {
    return `
      <div class="ce-head">
            <i class="fa-solid fa-xmark"
               onclick="closeClientDashboard()"
               id="accd"></i>

            <i class="fa-solid fa-circle-chevron-right"
               onclick="switchViewClientDashboard(null, true, true)"
               id="arfc"></i>

            <div class="main-client-dashbaord-card-action" id="cdMActions">
               ${renderClientDashboardMenuActions()}
            </div>
      </div>
      <div class="ce-body" id="client-template-dashboard">
         <div class="client-card" id="the-client-card" data-ci="{{client.client_id}}">
            <div class="type-clean-order" id="typeCleanOrder">
               <div class="tco-header">
                     <i class="icon icon-64">
                        ${await icon("order")}
                     </i>
                     <span>סוג הזמנה</span>
               </div>
               <div class="tco-search">
                     <i class="fa-solid fa-magnifying-glass"></i>
                     <input type="text" id="tcoSearch" placeholder="חפש סוג הזמנה">
               </div>
               <div class="tco-body" id="tcoItems">
               </div>
            </div>
         </div>

         <div class="client-card" id="the-client-orders">
            <div class="client-orders-head">
               <span>הזמנות אחרונות</span>
               <div class="client-orders-search">
                     <input type="text" class="input-orders-search" id="clientOrdersSearch" placeholder="תאריך, מזהה, מחיר">
               </div>
            </div>
            <div class="client-orders-body">
               <div class="cleaneril-list list-client-orders" id="listClientOrders">
               <i class="icon icon-64" id="iel-orders">
                  ${await icon('empty-list')}
               </i>
               </div>
            </div>

         </div>
         <div class="client-card" id="the-client-invoice">
            <div class="receipt-img show" id="receiptImgTemplate">
               <img alt="invoice" class="img-invoice" id="imgReceipt">
               <i class="icon icon-64" id="before-load-receipt">
                  ${await icon("document")}
               </i>
            </div>
            <div class="edit-receipt-order" id="receiptEditTemplate">
               <div class="box-loading"></div>
            </div>
         </div>
         <div class="client-card" id="the-client-receipts">
            <div class="client-receipts-head">
               <span>קבלות אחרונות</span>
               <div class="client-receipts-search">
                     <input type="text" class="input-receipts-search" id="clientReceiptsSearch" placeholder="תאריך, מזהה">
               </div>
            </div>
            <div class="client-receipts-body">
               <div class="cleaneril-list list-client-receipts icon-empty-list" id="listClientReceipts">
               <i class="icon icon-64" id="iel-receipts">
                  ${await icon('empty-list')}
               </i>
               </div>
            </div>
         </div>
         <div id="receiptTemplate"></div>

         <div class="client-card" id="client-reports">
            <div class="box-loading"></div>
         </div>


         <div class="client-card" id="uiShareOrderMarketplace">
            <div class="client-report-empty">
               <span>כאן אפשר לשתף עבודות לעסקים אחרים</span>
               <i class="fa-solid fa-earth-africa" style="font-size: 25px;opacity: 0.7;"></i>
            </div>
         </div>
      </div>
    `;
}



async function onOrderDeleted(res){
   
   await fetchOrders()
   await fetchClients()
   if (c_c_dashboard.enter){
      renderListOrdersClientDashboard()
   }
   renderListOrdersAll()
}

async function onOrderUpdate(res) {
   await fetchOrders();
   await fetchClients()
   if (c_c_dashboard.enter){
      renderListOrdersClientDashboard()
   }
   renderListOrders()
}

async function onOrderCreated(res) {
   await fetchOrders();
   await fetchClients()
   if (c_c_dashboard.enter){
      renderListOrdersClientDashboard()
   }
   renderListOrders()
}