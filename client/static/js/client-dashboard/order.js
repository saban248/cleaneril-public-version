/**
 * 
 * @param {Object} items 
 * @param {Boolean} editor 
 */

function renderTableOfItemsOnOrder(items, editor){

    return `
    <div class="items-ordered">
        <div class="header ordered">
            <span>שם</span>
            <span>מחיר</span>
        </div>
        <div id="items-ordered">
            ${items.map((item, index) => {
                const itemId = item.id ?? item.key;
                const safeItemId = itemId;
                const itemName = item.name;
                const itemPrice = item.price;
                return `
                <div class="ordered" id="${index}">
                    <span class="s-item-name" id="${index}-name">${itemName}</span>
                    <span class="s-item-price" id="${index}-price">${itemPrice}₪</span>
                    ${editor
                        ? `<i class="fa-solid fa-trash-can trash-order" onclick="deleteItemClientOrder('${safeItemId}')"></i>`
                        : ''
                    }
                </div>
                `;
            }).join('')}
            ${!editor ? `
                <div class="ordered osummary" id="summary">
                    <span class="s-item-name" id="summary-name">סיכום</span>
                    <span class="s-item-price" id="summary-price">${items.length} פריטים</span>
                </div>
            ` : ''}
        </div>
    </div>
    `

}


function renderClientOrder(order, editor ) {
    const company = c_runtime.company;

    if (!order || !company) return '';

    const timestamp = Number(order.date)
    const dateTimestamp = timestamp > 1e12 ? timestamp / 1000 : timestamp;
    const date = new Date(dateTimestamp * 1000);

    const pad = value => String(value).padStart(2, '0');

    const dateArrive = date =>
        `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;

    const dateArriveRaw = date =>
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    const timeArrive = date =>
        `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    const getCTime = value => {
        const d = new Date(Number(value) * 1000);
        return d.toString().split(' ').slice(0, 5).join(' ');
    };

    const vatOfPrice = price => {
        const value = Number(price) || 0;
        const vatRate = Number(ServerConfig.VAT_IL) || 0;
        return Number((value + value * (vatRate / 100)).toFixed(2));
    };

    const formatPrice = value => {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    };

    const items = Object.values(order.items);
    const itemCount = items.length;

    const orderTypeTitle = getCleanOrderTypeText(order.order_type);
    const companyName = company.company_name;
    const companyDescription = company.company_description;
    const companyPhone = company.company_phone;
    const companyEmail = company.company_email;
    const companyLogo = company.logo_path;

    const fullname = order.fullname;
    const address = order.address;
    const phone = order.phone;
    const notes = order.notes;

    const price = formatPrice(order.price);
    const offPrice = formatPrice(order.off_price);
    const expense = formatPrice(order.expense);
    const profitSharing = formatPrice(order.profit_sharing);

    const finalPrice = price - offPrice;
    const displayedPrice = order.vat ? vatOfPrice(price) : price;
    const displayedOffPrice = order.vat
        ? vatOfPrice(finalPrice)
        : finalPrice;

    const orderDate = dateArrive(date);
    const orderDateRaw = dateArriveRaw(date);
    const orderTime = timeArrive(date);

    const editorOrderTypeHTML = editor ? `
        <span id="dc1" class="edit-order-type-btn"
              onclick="showSelectOrderTypeToCreate(true)">
            ${orderTypeTitle}
        </span>
        <div class="type-clean-order exist" id="typeCleanOrder">
            <div class="tco-header">
                <i class="icon icon-64">
                    <svg class="icon-order-placeholder"></svg>
                </i>
                <span>סוג הזמנה</span>
            </div>
            <div class="tco-search">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="tcoSearch" placeholder="חפש סוג הזמנה">
            </div>
            <div class="tco-body" id="tcoItems"></div>
        </div>
    ` : `
        <span id="dc1">${orderTypeTitle}</span>
    `;

    const clientDetailsHTML = editor ? `
        <div class="cd-item">
            <span>לכבוד</span>
            <input class="c-input-fn" type="text" id="fullname"
                   placeholder="שם מלא" value="${fullname}"
                   oninput="searchClientNewOrder(event)">
            <div class="filter-options" id="mf-sc"></div>
        </div>
        <div class="cd-item">
            <span>לתאריך</span>
            <input class="c-input-date" type="date" id="client-date"
                   value="${orderDateRaw}">
        </div>
        <div class="cd-item">
            <span>שעות הגעה</span>
            <input class="c-input-date" type="time" id="client-time"
                   step="3600" value="${orderTime}">
        </div>
        <div class="cd-item">
            <span>בכתובת</span>
            <input class="c-input-location" type="text" id="client-location"
                   placeholder="כתובת מלאה" value="${address}">
        </div>
        <div class="cd-item">
            <span>פאלפון</span>
            <input class="c-input-fn" type="text" id="client-phone"
                   placeholder="מספר נייד" value="${phone}">
        </div>
    ` : `
        <div class="cd-item">
            <span>לכבוד</span>
            <span class="cd-name">${fullname}</span>
        </div>
        <div class="cd-item">
            <span>לתאריך</span>
            <span class="cd-name">${orderDate}</span>
        </div>
        <div class="cd-item">
            <span>שעות הגעה</span>
            <span class="cd-name">${orderTime}</span>
        </div>
        <div class="cd-item">
            <span>בכתובת</span>
            <span class="cd-name">${address}</span>
        </div>
        <div class="cd-item">
            <span>פאלפון</span>
            <span class="cd-name">${phone}</span>
        </div>
    `;

    const editorPricesHTML = editor ? `
        <div class="off-price">
            <span>מחיר סופי (לפני הנחה / הוצאות)</span>
            <input type="tel" class="c-input-fn price-all"
                   placeholder="0.00" id="client-price" value="${Math.trunc(price)}">
        </div>
        <div class="off-price">
            <span>הנחה</span>
            <input type="tel" class="c-input-fn price-all"
                   placeholder="0.00" id="client-off-price" value="${Math.trunc(offPrice)}">
        </div>
        <div class="off-price">
            <span>הוצאות דלק / פרסום</span>
            <input type="tel" class="c-input-fn price-all"
                   placeholder="0.00" id="client-expense" value="${expense}">
        </div>
        <div class="off-price psharing" id="psharing">
            <span>תשלום לקבלן באחוזים (ספציפית על עיסקה זו)</span>
            <input class="c-input-fn price-all" type="tel"
                   id="profitSharing" value="${profitSharing}">
        </div>
        ${company.vat_company ? `
            <div class="off-price">
                <span>הוסף מע"מ</span>
                <input class="checkbox" type="checkbox" id="client-vat"
                       onclick="compareVatOfPrice(this)" ${order.vat ? 'checked' : ''}>
            </div>
        ` : ''}
    ` : `
        ${order.off ? `
            <span class="price-all">${displayedOffPrice}<span style="color: #6e6e6e;font-size: 1.1rem;">₪</span></span>
        ` : ''}
        <span class="price-all ${order.off ? 'price-all-off' : ''}">
            ${displayedPrice}
            <span id="spnprice" style="color: #6e6e6e;font-size: 1.1rem;">₪</span>
        </span>
        ${order.vat ? '<span class="p-vat">כולל מע"מ</span>' : ''}
    `;

    const workerAndPaymentHTML = editor ? `
        <div class="prices${order.off ? ' price-off-price' : ''} editor-prices">
            <div class="off-price">
                <span>קבלן / עובד שמבצע מטעמך</span>
                <div class="worker-select" id="pws">
                    <div class="employee-selected-main" id="esm"></div>
                    <input type="text" class="c-input-fw price-all"
                           placeholder="חפש עובד" id="client-worker"
                           autocomplete="off" oninput="onSearchWorker()">
                    <div class="worker-dropdown" id="worker-dropdown"
                         style="display: none;"></div>
                    <input type="hidden" id="lsw${order.worker}">
                </div>
            </div>
            <div class="off-price">
                <span>סוג תשלום</span>
                <div class="pay-group" id="payGroup" data-tp="${Number(order.payment_type) || PaymentInvoice.CASH}">
                    <button data-tp="${PaymentInvoice.BANK_TRANSFER}">
                        <span>העברה</span>
                    </button>
                    <button data-tp="${PaymentInvoice.CASH}" id="tp-default">
                        <span>מזומן</span>
                    </button>
                    <button data-tp="${PaymentInvoice.CHECK}">
                        <span>צ'ק</span>
                    </button>
                    <button data-tp="${PaymentInvoice.OTHER}">
                        <span>אחר</span>
                    </button>
                    <div class="indicator"></div>
                </div>
            </div>
        </div>
    ` : '';

    return `
        <div class="client-head">
            <div class="client-h-title">
                <img src="/static/images/logo/${companyLogo}">
                <div class="dcompany">
                    ${editorOrderTypeHTML}
                    <div class="cd-calls">
                        <div>
                            <i class="fa-solid fa-phone-flip"></i>
                            <span>${companyPhone}</span>
                        </div>
                        <div>
                            <i class="fa-solid fa-envelope"></i>
                            <span>${companyEmail}</span>
                        </div>
                    </div>
                    <span id="dc2">${companyName} • ${companyDescription}</span>
                </div>
            </div>
            <div class="client-details" id="clientOrderDetails">
                ${clientDetailsHTML}
            </div>
        </div>

        <div class="show-progress" id="clientProgressPublish">
            <i id="cpp-icon"></i>
            <div class="details-progress">
                <span class="cpp-title" id="cpp-title">שומר את ההזמנה</span>
                <span id="cpp-fn"></span>
                <span id="cpp-stat">סוג הזמנה:
                    <span></span>
                </span>
            </div>
        </div>

        <div class="client-body" id="clientOrderBody">
            <div class="clean-items">
                <div class="ci-head">
                    <span>פריטים שהוזמנו</span>
                    ${editor ? `
                        <div class="cih-action">
                            <button class="ci-add-item" type="button"
                                    onclick="addItemClientOrder()"
                                    aria-label="הוספת פריט" title="הוספת פריט">
                                <i class="fa-solid fa-plus"></i>
                                <span>הוספת פריט</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="ci-body">
                 ${renderTableOfItemsOnOrder(items, editor)}
                </div>
            </div>

            <div class="ci-notes">
                <span>הערות</span>
                <div class="notes-content">
                    <textarea class="c-input-notes ${!editor ? 'dis-notes' : ''}"
                              placeholder="הכנס הערות..." id="client-notes">${notes}</textarea>
                </div>
            </div>

            <div class="prices${order.off ? ' price-off-price' : ''}${editor ? ' editor-prices' : ''}">
                <div class="${!editor ? 'm-price' : ''}">
                    ${editorPricesHTML}
                </div>
            </div>

            ${workerAndPaymentHTML}

            ${!editor ? `
                <div class="price-notes">
                    <i class="fa-solid fa-circle-info"></i>
                    <span>
                        ניתן לשלם בהעברה בנקאית / ביט / פייבוקס / מזומן<br>
                        בכל אופן אחר נא לתאם מראש
                    </span>
                </div>
            ` : ''}
        </div>

        <div class="footer-time-signature ${editor ? 'disable' : ''}">
            <span></span>
            ${getCTime(order.timestamp_entered)} • ${order.key}-${order.order_id}
        </div>

        <div class="client-footer ${!editor ? 'disable' : ''}">
            <div class="card-action-editor" id="beforeProgressDone"></div>
            <div class="card-action-editor-saved" id="afterProgressDone">
                <i class="fa-solid fa-eye"
                   onclick="initClientOrder('${order.order_id}')"></i>
            </div>
        </div>
    `;
}