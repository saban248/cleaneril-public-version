

const CleanerILProducts = [
    {   
        orderType:CleanOrderType.AIR_CONDITIONER,
        title:"מזגן עילי",
        raw:'מזגן עילי 1.5 כ"ס מאייד+מאיץ+פילטרים',
        key:1,
        price:199
    },
        {   
        orderType:CleanOrderType.AIR_CONDITIONER,
        title:"מזגן עילי",
        raw:'מזגן עילי 2.5 כ"ס מאייד+מאיץ+פילטרים',
        key:2,
        price:199
    },
        {   
        orderType:CleanOrderType.AIR_CONDITIONER,
        title:"מזגן עילי",
        raw:'מזגן עילי 3.5 כ"ס מאייד+מאיץ+פילטרים',
        key:3,
        price:199
    },
    {   
        orderType:CleanOrderType.AIR_CONDITIONER,
        title:"מיני מרכזי",
        raw:'מיני מרכזי 4-6 כ"ס סוללה+פילטרים',
        key:4,
        price:400
    },
    {   
        orderType:CleanOrderType.AIR_CONDITIONER,
        title:"תעלות מיני מרכזי / מרכזי",
        raw:'תעלת מיזוג אוויר ס.שרשור ',
        key:5,
        price:200
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"ספה סוג בד רחיץ",
        raw:'ספה 2 מקומות ס.בד +כריות',
        key:6,
        price:200
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"ספה סוג בד רחיץ",
        raw:'ספה 3 מקומות ס.בד +כריות',
        key:7,
        price:300
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"ספה סוג בד רחיץ",
        raw:'ספה 2+3 מקומות ס.בד +כריות',
        key:8,
        price:360
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"כורסא סוג בד רחיץ",
        raw:'כורסא קטנה גב+מושב+ידיות',
        key:9,
        price:100
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"כורסא סוג בד רחיץ",
        raw:'כורסא בינונית גב+מושב+ידיות',
        key:10,
        price:150
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"כורסא סוג בד רחיץ",
        raw:'כורסא גדולה גב+מושב+ידיות',
        key:11,
        price:200
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"מזרן יחיד",
        raw:"מזרן יחיד צד אחד",
        key:12,
        price:200
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"מזרן יחיד",
        raw:"מזרן יחיד שני צדדים",
        key:13,
        price:250
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"מזרן זוגי",
        raw:"מזרן זוגי צד אחד",
        key:14,
        price:300
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"מזרן זוגי",
        raw:"מזרן זוגי שני צדדים",
        key:15,
        price:350
    },
    {
        orderType:CleanOrderType.UPHOLSTERY,
        title:"מזרן זוגי",
        raw:"מזרן זוגי שני צדדים + שתן",
        key:16,
        price:400
    },



]



function getCILProductByKey(key){
    return c_runtime.products.find(p=>p.key==key)
}