
function getReceiptsByOrderId(oid){
    return c_runtime.invoices.find(r => r.order_id == oid && !r.is_credit)
}


