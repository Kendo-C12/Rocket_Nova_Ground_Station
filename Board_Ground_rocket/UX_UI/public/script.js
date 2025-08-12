/* public/script.js */
const socket = io();
let charts = [];
let chartData = [];
let n_chart = 0;

const graphsContainer = document.getElementById('graphsContainer');
const addGraphBtn = document.getElementById('addGraphBtn');

/* Value From Key*/
function getValueFromKey(key, data) {
  let value;
  switch (key) {
    case "time":
      value = parseInt(data.time, 10);
      break;
    case "state":
      value = data.state;
      break;
    case "gps_latitude":
      value = parseFloat(data.gps_latitude);
      break;
    case "gps_longitude":
      value = parseFloat(data.gps_longitude);
      break;
    case "altitude":
      value = parseFloat(data.altitude);
      break;
    case "pyro_a":
      value = data.pyro_a;
      break;
    case "pyro_b":
      value = data.pyro_b;
      break;
    case "temperature":
      value = parseFloat(data.temperature);
      break;
    case "pressure":
      value = parseFloat(data.pressure);
      break;
    case "acc_x":
      value = parseFloat(data.acc_x);
      break;
    case "acc_y":
      value = parseFloat(data.acc_y);
      break;
    case "acc_z":
      value = parseFloat(data.acc_z);
      break;
    case "gyro_x":
      value = parseFloat(data.gyro_x);
      break;
    case "gyro_y":
      value = parseFloat(data.gyro_y);
      break;
    case "gyro_z":
      value = parseFloat(data.gyro_z);
      break;
    case "last_ack":
      value = parseInt(data.last_ack, 10);
      break;
    case "last_nack":
      value = parseInt(data.last_nack, 10);
      break;
    default:
      value = null;
  }
  return value;
}
function getColorByState(state) {
  switch(state.toLowerCase()) {
    case 'startup':     return '#A9A9A9';
    case 'idle_safe':   return '#708090';
    case 'armed':       return '#FFD700';
    case 'pad_preop':   return '#FFA500';
    case 'powered':     return '#FF4500';
    case 'coasting':    return '#FF6347';
    case 'drog_depl':   return '#FF8C00';
    case 'drog_desc':   return '#FF7F50';
    case 'main_depl':   return '#DC143C';
    case 'main_desc':   return '#B22222';
    case 'landed':      return '#228B22';
    case 'rec_safe':    return '#2E8B57';
    default:            return '#000000'; // สีดำถ้าไม่ตรงกับ state ใดๆ
  }
}

/* localStorage */
function saveChartData(key,data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function loadChartData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

/* Uplink Command */
document.getElementById('sendBtn').addEventListener('click', () => {
  const value = document.getElementById('commandSelect').value;
  socket.emit("uplink",value);
  console.log('Sent:', value);
});

/* Chart Configuration */
function createChart(canvas, {
  xLabel = 'เวลา (s)', 
  yLabel = 'ค่า', 
  borderColor = 'rgb(75, 192, 192)', 
  yMin = 0, 
  yMax = null,
  xType = 'category', // หรือ 'time' ถ้าใช้เวลาจริงๆ
  xTimeFormat = null  // ตัวเลือก format สำหรับแกนเวลา เช่น 'HH:mm:ss'
  }) 
{
  canvas.width = 600;
  canvas.height = 300;
  graphsContainer.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: yLabel,
        data: [],
        fill: false,
        borderColor: borderColor,
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
      //   segment: {
      //     borderColor: (ctx) => {
      //       // ctx.p0 และ ctx.p1 เป็นจุดก่อนหน้าและถัดไป (มี parsed.x / parsed.y)
      //       const x0 = ctx.p0.parsed.x;
      //       const x1 = ctx.p1.parsed.x;
      //       // เอาค่ากลางของ segment มาตัดสิน
      //       const mid = (x0 + x1) / 2;
      //       return getColorByState(mid);  // ถ้า mid อยู่ในช่วง 1-10 -> ฟ้า, 20-30 -> แดง
      //   }
      // }
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: {
            title: { display: true, text: xLabel },
            type: 'linear'
        },
      
        y: {
            title: { display: true, text: yLabel },
            beginAtZero: true
        }
      }
    }
  });
  charts.push({"chart":chart, "x": xLabel, "y": yLabel});
  return chart
}

/* Update Chart */
function updateChartLinear(chartIndex, chart, xVal, yVal,state) {
  chart.data.datasets[0].data.push({"x": xVal, "y": yVal});
  if (chart.data.datasets[0].data.length > 50) {
    chart.data.datasets[0].data.shift();
  }
  chart.update();

  chartData[chartIndex].data.push({"x": xVal, "y": yVal});
  chartData[chartIndex].state.push(state);
  if (chartData[chartIndex].data.length > 50) {
    chartData[chartIndex].data.shift();
  }
}

/* Add Chart */
document.getElementById('addGraphBtn').addEventListener('click', () => {
  const container = document.createElement('canvas');
  container.id = `chart${charts.length}`;
  //document.getElementById('graphsContainer').appendChild(container);

  const x = document.getElementById('xValue').value;
  const y = document.getElementById('yValue').value;

  createChart(container,{xLabel: x, yLabel: y});

  n_chart++;
  chartData.push({"name_x": x, "name_y": y, "data": [], "state": []});
});

/* Clear Chart */
document.getElementById('clearGraphBtn').addEventListener('click', () => {
  localStorage.clear();  // ลบข้อมูลทุก key ใน localStorage
  n_chart = 0;
});

/* Serial Data : Flexible monitor and chart update */
socket.on('serial-data', (data) => {
  console.log('Received data:', data);
  document.getElementById('output').textContent =
    `time: ${data.time}s | state: ${data.state} | GPS: (${data.gps_latitude}, ${data.gps_longitude}) | altitude: ${data.altitude}m | pyro: (${data.pyro_a}, ${data.pyro_b}) | temperature: ${data.temperature}°C | pressure: ${data.pressure}hPa | acc: (${data.acc_x}, ${data.acc_y}, ${data.acc_z}) | gyro: (${data.gyro_x}, ${data.gyro_y}, ${data.gyro_z}) | last_ack: ${data.last_ack} | last_nack: ${data.last_nack}`;


  console.log(`Chart update: ${n_chart} charts`);
  saveChartData(`n_chart`, n_chart);

  // Update each chart with the new data
  for(let i = 0; i < charts.length; i++) {
    const chart = charts[i]["chart"];
    const xValue = getValueFromKey(charts[i]["x"], data);
    const yValue = getValueFromKey(charts[i]["y"], data);
    console.log(`Updating chart ${i} with x: ${xValue}, y: ${yValue}`);
    updateChartLinear(i, chart, xValue, yValue, data.state);

    saveChartData(`chartData_${i}`, chartData[i]);
  }
});

/* Load Chart Data */
window.onload = () => {
  n_chart = loadChartData('n_chart');
  if (!n_chart || isNaN(n_chart)) { n_chart = 0; }

  for(let i = 0; i < n_chart; i++) {
    chartData[i] = loadChartData(`chartData_${i}`);
    const container = document.createElement('canvas');
    container.id = `chart${charts.length}`;

    createChart(container, {
      xLabel: chartData[i].name_x,
      yLabel: chartData[i].name_y,
    });

    // Restore chart data
    charts[i].chart.data.datasets[0].data = chartData[i].data;
  }
  
  document.getElementById('clearGraphBtn').addEventListener('click', () => {
    localStorage.clear();
    alert('Local storage cleared!');
  });
  
};