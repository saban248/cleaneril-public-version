




function formatNumber(num) {
  return num.toLocaleString('he-IL'); // 6,500
}

function updateUIreports(selector, value, icon = '₪') {
  document.getElementById(selector).innerText = formatNumber(value) + ` ${icon}`;
}



function getYearsItems({ past = 20, future = 0} = {}) {
    const currentYear = new Date().getFullYear();
    const items = [];

    for (let y = currentYear - past; y <= currentYear + future; y++) {
        items.push({
            text: String(y),
            value: y,
            action: () => selectYearReportsChart(y),
            icon: '<i class="fa-solid fa-calendar-days"></i>'
        });
    }

    return items;
}
function openMenuSelectYear(){
    const items = getYearsItems()
    const menu = document.getElementById("yearFundsMenu")

    if (menu.classList.contains("show")) {
        menu.classList.remove("show")
        return
    }
    menu.replaceChildren() // ניקוי

    items.forEach(item => {
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
            item.action(item.text)
            menu.classList.remove("show")
        }
        menu.appendChild(cma)
    })

    menu.classList.add("show")
}

async function selectYearReportsChart(y){
  const element = document.getElementById("selectedYearReportsGraph");
  await fetchGraphFunds(y)
  await fetchGraphOrders(y)
  element.textContent = y

}

document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", e => {
      const menu = document.getElementById("yearFundsMenu")
        if (!menu.contains(e.target) && !e.target.classList.contains("year-select")) {
            menu.classList.remove("show")
        }
    })

});
