let chartReportsFunds;
let chartReportsOrders;

const chartConfiguration = (series, icon = '₪') => {
  return {
    chart: {
      type: 'line',
      height: 350,
      stacked: false,
      toolbar: { 
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      background: 'transparent'
    },
    stroke: {
      width: [0, 4, 3, 3],
      curve: 'smooth',
      dashArray: [0, 0, 5, 5] // Added dash effect for average lines
    },
    plotOptions: {
      bar: { 
        borderRadius: 6,
        columnWidth: '65%',
        dataLabels: { position: 'top' }
      }
    },
    legend: { 
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '11px',
      fontFamily: 'inherit',
      markers: { radius: 12 },
      itemMargin: { horizontal: 10, vertical: 5 }
    },
    series:series,
    dataLabels: { 
      enabled: false, 
      formatter: val => val?.toLocaleString('he-IL')
    },
    labels: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"],
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: '12px', colors: '#64748b' }
      }
    },
    yaxis: [
      { 
        forceNiceScale: true, 
        labels: { 
          formatter: val => val?.toLocaleString('he-IL') + ' '+icon,
          style: { colors: '#64748b' }
        }, 
        show: true 
      },
      { opposite: true, min: 0, forceNiceScale: true, show: false },
      { opposite: true, min: 0, forceNiceScale: true, show: false },
      { opposite: true, min: 0, forceNiceScale: true, show: false }
    ],
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 0, bottom: 0, left: 10 }
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'light',
      y: {
        formatter: val => val !== undefined ? val.toLocaleString('he-IL') + ' '+icon : val
      }
    },
    colors: ['#1c9548', '#3b82f6', '#9508ad', '#c7c41d'],
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: { height: 300 },
          legend: { position: 'bottom', horizontalAlign: 'center' }
        }
      }
    ]
  };
}

const chartFundsSeries = (x1, x2, x3, x4) => {
  return [
      { name: 'הכנסות', type: 'column', data: x1||[] },
      { name: 'הוצאות', type: 'line', data: x2||[] },
      { name: 'ממוצע ר.פ.ל', type: 'line', data:x3||[], visible: false },
      { name: 'ממוצע ה.פ.ל', type: 'line', data: x4||[], visible: false }
    ]
}

const chartFundsConfiguration = () => {
  return  chartConfiguration(chartFundsSeries())
}

function initChartsFunds(monthlyIncome, monthlyCustomers) {
  chartReportsFunds = new ApexCharts(
    document.getElementById("chartReportsFunds"),
    chartFundsConfiguration()
  );
  chartReportsFunds.render()
}



function chartFundsUpdateSeries(monthlyIncome, monthlyExpenses, monthlyAIPCM, monthlyAEPCM) {
  chartReportsFunds.updateSeries(chartFundsSeries(monthlyIncome, monthlyExpenses, monthlyAIPCM, monthlyAEPCM));
}

function prepareMonthlyDataGraphFunds(transactions, year){
  const monthlyIncome = Array(12).fill(0);
  const monthlyExpenses = Array(12).fill(0);
  const monthlyAIPCM = Array(12).fill(0)
  const monthlyAEPCM = Array(12).fill(0)

  transactions.forEach(t => {
    const [y, m] = t.date.split("."); 

    if(Number(y) === Number(year)){
      const monthIndex = Number(m) - 1;

      monthlyIncome[monthIndex] += Number(t.amount);
      monthlyExpenses[monthIndex]+= Number(t.expense)
      monthlyAIPCM[monthIndex] = Number(t.average_income)
      monthlyAEPCM[monthIndex] = Number(t.average_expense)
    }
  });

  return { monthlyIncome, monthlyExpenses, monthlyAIPCM, monthlyAEPCM};
}



function initChartsOrders(){
  chartReportsOrders = new ApexCharts(
    document.getElementById("chartReportsOrders"),
    chartOrdersConfiguration()
  );
  chartReportsOrders.render()
}

const chartOrdersSeries = (x1, x2, x3, x4) => {
  return [
      { name: 'פריטים', type: 'column', data: x1||[] },
      { name: 'ביטולים', type: 'line', data: x2||[] },
      { name: 'הזמנות', type: 'line', data: x3||[], visible: false },
      { name: 'ממוצע ל.ח', type: 'line', data: x4||[], visible: false }
    ]
}

const chartOrdersConfiguration = () => {
  return chartConfiguration(chartOrdersSeries(), '')
}

function chartOrdersUpdateSeries(monthlyItems, monthlyCanceled, monthlyOrders, monthlyACR) {
  chartReportsOrders.updateSeries(chartOrdersSeries(monthlyItems, monthlyCanceled, monthlyOrders, monthlyACR));
}

function prepareMonthlyDataGraphOrders(transactions, year){
  const monthlyItems = Array(12).fill(0);
  const monthlyCanceled = Array(12).fill(0);
  const monthlyOrders = Array(12).fill(0)
  const monthlyACR = Array(12).fill(0)

  transactions.forEach(t => {
    const [y, m] = t.date.split("."); 

    if(Number(y) === Number(year)){
      const monthIndex = Number(m) - 1;

      monthlyItems[monthIndex] += Number(t.items);
      monthlyCanceled[monthIndex]+= Number(t.canceled)
      monthlyOrders[monthIndex] += 1
      monthlyACR[monthIndex] = Number(t.average_client_repeat_percent)
    }
  });

  return { monthlyItems, monthlyCanceled, monthlyOrders, monthlyACR};
}
