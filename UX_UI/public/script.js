/* public/script.js */
const socket = io();
const charts = [];

const graphsContainer = document.getElementById('graphsContainer');
const addGraphBtn = document.getElementById('addGraphBtn');

/* Value From Key*/
function getValueFromKey(key, data) {
  let value;

  switch (key) {
    case "time":
      value = data.time;
      break;
    case "state":
      value = data.state;
      break;
    case "gps_latitude":
      value = data.gps_latitude;
      break;
    case "gps_longitude":
      value = data.gps_longitude;
      break;
    case "altitude":
      value = data.altitude;
      break;
    case "pyro_a":
      value = data.pyro_a;
      break;
    case "pyro_b":
      value = data.pyro_b;
      break;
    case "temperature":
      value = data.temperature;
      break;
    case "pressure":
      value = data.pressure;
      break;
    case "acc_x":
      value = data.acc_x;
      break;
    case "acc_y":
      value = data.acc_y;
      break;
    case "acc_z":
      value = data.acc_z;
      break;
    case "gyro_x":
      value = data.gyro_x;
      break;
    case "gyro_y":
      value = data.gyro_y;
      break;
    case "gyro_z":
      value = data.gyro_z;
      break;
    case "last_ack":
      value = data.last_ack;
      break;
    case "last_nack":
      value = data.last_nack;
      break;
    default:
      value = null;
  }

  return value;
}

/* Uplink Command */
document.getElementById('sendBtn').addEventListener('click', () => {
  const value = document.getElementById('commandSelect').value;
  socket.emit("uplink",value);
  console.log('Sent:', value);
});

/* Chart Configuration */
function createChart(ctx, {
  xLabel = 'เวลา (s)', 
  yLabel = 'ค่า', 
  borderColor = 'rgb(75, 192, 192)', 
  yMin = 0, 
  yMax = null,
  xType = 'category', // หรือ 'time' ถ้าใช้เวลาจริงๆ
  xTimeFormat = null  // ตัวเลือก format สำหรับแกนเวลา เช่น 'HH:mm:ss'
} = {}) 
{

  const canvas = document.createElement('canvas');
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
        segment: {
        borderColor: (ctx) => {
          // ctx.p0 และ ctx.p1 เป็นจุดก่อนหน้าและถัดไป (มี parsed.x / parsed.y)
          const x0 = ctx.p0.parsed.x;
          const x1 = ctx.p1.parsed.x;
          // เอาค่ากลางของ segment มาตัดสิน
          const mid = (x0 + x1) / 2;
          return colorForX(mid);  // ถ้า mid อยู่ในช่วง 1-10 -> ฟ้า, 20-30 -> แดง
        }
      }
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
  charts.push(chart);
}
function updateChartLinear(chart, xVal, yVal,state) {
  chart.data.datasets[0].data.push({x: xVal, y: yVal});

  if (chart.data.datasets[0].data.length > 50) {
    chart.data.datasets[0].data.shift();
  }

  
  chart.update();
}

/* Add Chart */
document.getElementById('addGraphBtn').addEventListener('click', () => {
  const container = document.createElement('canvas');
  container.id = `chart${charts.length}`;
  document.getElementById('graphsContainer').appendChild(container);
  
  createGraph(container.id, `Graph ${charts.length + 1}`);
});

/* Serial Data : Flexible monitor and chart update */
socket.on('serial-data', (data) => {
  document.getElementById('output').textContent =
    `time: ${data.time}s | state: ${data.state} | GPS: (${data.gps_latitude}, ${data.gps_longitude}) | altitude: ${data.altitude}m | pyro: (${data.pyro_a}, ${data.pyro_b}) | temperature: ${data.temperature}°C | pressure: ${data.pressure}hPa | acc: (${data.acc_x}, ${data.acc_y}, ${data.acc_z}) | gyro: (${data.gyro_x}, ${data.gyro_y}, ${data.gyro_z}) | last_ack: ${data.last_ack} | last_nack: ${data.last_nack}`;

  for(let i = 0; i < charts.length; i++) {

    const chart = charts[i]["chart"];
    const xValue = getValueFromKey(charts[i]["x"], data);
    const yValue = getValueFromKey(charts[i]["y"], data);
    updateChartLinear(chart, xValue, yValue);
  }
});

