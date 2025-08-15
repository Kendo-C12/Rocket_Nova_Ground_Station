/* public/script.js */
const socket = io();
let charts = [];
let chartData = [];
let n_chart = 0;
let shiftValue = 50;

const graphsContainer = document.getElementById('graphsContainer');
const addGraphBtn = document.getElementById('addGraphBtn');

const key_state = [STARTUP,IDLE_SAFE,ARMED,PAD_PREOP,POWERED,COASTING,DROG_DEPL,DROG_DESC,MAIN_DEPL,MAIN_DESC,LANDED,REC_SAFE]
const key_pyro = [];

/* Lenght text */
function lenght_text(label){
  switch(label){
    case 'state': return key_state.length(); 
    case 'pyro' : return key_pyro.length();
  }
  return 0;
}

/* Text to Key */
function text_to_key(label,text){
  switch(label){
    case 'state' :
      for(let i = 0;i < key_state.length();i++){
        if(key_state[i].toLowerCase() == text) { return i }
      }
      break;
    case 'pyro_a' || 'pyro_b' :
      for(let i = 0;i < key_pyro.lenght();i++){
        if(key_pyro[i].toLowerCase() == text) { return i }
      }
      break;
  }
}
/* Key to Text */
function key_to_text(label,key){
  switch(label){
    case 'state' :
      return key_state[key];
      break;
    case 'pyro_a' || 'pyro_b' :
      return key_pyro[key];
      break;
  }
}

/* Value From Key*/
function getValueFromKey(key, data) {
  let value;
  switch (key) {
    case "time":
      value = parseInt(data.time, 10);
      break;
    case "state":
      value = text_to_key('state',data.state);
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
      value = text_to_key('pyro',data.pyro_a);
      break;
    case "pyro_b":
      value = text_to_key('pyro',data.pyro_b);
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
/* Is value's label is text ot not */
function isText(label){
  if(label == 'state' || label == 'pyro_a' || label == 'pyro_b') { return 1; }
  return 0;
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
  let chart;
  if(isText(xLabel) || isText(yLabel)){
    chart = new Chart(ctx, {
      type: `${xLabel} and ${yLabel}`,
      data: {
        datasets: [{
          label: '${x}',
          data: data,
          borderColor: 'blue',
          stepped: true,
          fill: false
        }]
      },
      options: {
        parsing: false,
        scales: {
          x: {
              title: { display: true, text: xLabel },
              type: 'linear'
          },
          y: {
            ticks: {
              callback: (value) => key_to_text[ylabel,value], // Show text instead of numbers
            },
            min: 0,
            max: lenght_text(yLabel) - 1,
            stepSize: 1
          }
        }
      }
    });
  }
  else
  {  
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: `${xLabel} and ${yLabel}`,
          data: [],
          fill: false,
          borderColor: borderColor,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
          segment: {
            borderColor: (ctx) => {
              return ctx.p0.raw.color;
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
  }
  charts.push({"chart":chart, "x": xLabel, "y": yLabel});
  return chart
}

/* Update Chart */
function updateChartLinear(chartIndex, chart, xVal, yVal,state) {
  chart.data.datasets[0].data.push({"x": xVal, "y": yVal, "color": getColorByState(state)});
  if (chart.data.datasets[0].data.length > 50) {
    chart.data.datasets[0].data.shift();
  }
  chart.update();

  chartData[chartIndex].data.push({"x": xVal, "y": yVal, "color": getColorByState(state)});
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

/* Number of value before shift */
document.getElementById('addNumber_of_valueBtn').addEventListener('click', () => {
  shiftValue = document.getElementById('xValue').value
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
    let yValue;
    if(isText(yValue))
      yValue = getValueFromKey(charts[i]["y"], data);
    else{
      yValue = getValueFromKey(charts[i]["y"], data);
    }
    console.log(`Updating chart ${i} with x: ${xValue}, y: ${yValue}`);
    updateChartLinear(i, chart, xValue, yValue, data.state);

    saveChartData(`chartData_${i}`, chartData[i]);
  }
});

/* Cmd data */
socket.on('cmd-data', (data) => {
  console.log('Received command data:', data);
  document.getElementById('output_cmd').textContent =
    `${data.cmd}`;
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