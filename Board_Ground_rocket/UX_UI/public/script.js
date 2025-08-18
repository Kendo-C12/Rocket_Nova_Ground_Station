/* public/script.js */
const socket = io();
let charts = [];
let chartData = [];
let n_chart = 0;
let shiftValue = 50;

const graphsContainer = document.getElementById('graphsContainer');
const addGraphBtn = document.getElementById('addGraphBtn');

const table = document.getElementById("dataTable");

const key_state = ["STARTUP","IDLE_SAFE","ARMED","PAD_PREOP","POWERED","COASTING","DROG_DEPL","DROG_DESC","MAIN_DEPL","MAIN_DESC","LANDED","REC_SAFE"];
const allLabel = ["counter","state","gps_latitude","gps_longitude","apogee","last_ack","last_nack"];
/* Length text */
function length_text(label){
  switch(label){
    case 'state': return key_state.length; 
  }
  return 0;
}

/* Text to Key */
function text_to_key(label,text){
  switch(label){
    case 'state' :
      for(let i = 0;i < key_state.length;i++){
        if(key_state[i].toLowerCase() == text) { return i }
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
    case "counter":
      value = parseInt(data.counter, 10);
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
    case "apogee":
      value = parseFloat(data.apogee);
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
  if(label == 'state') { return 1; }
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
  xMin = 0,
  xMax = null,
  xType = 'category', // หรือ 'time' ถ้าใช้เวลาจริงๆ
  xTimeFormat = null  // ตัวเลือก format สำหรับแกนเวลา เช่น 'HH:mm:ss'
  }) 
{
  console.log(xLabel, yLabel, xMin, xMax, yMin, yMax);
  canvas.width = 600;
  canvas.height = 300;
  graphsContainer.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let chart;
  if(isText(xLabel) || isText(yLabel)){
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
        parsing: false,
        scales: {
          x: {
              title: { display: true, text: xLabel },
              type: 'linear'
          },
          y: {
            ticks: {
              callback: (value) => key_to_text[yLabel,value], // Show text instead of numbers
            },
            min: 0,
            max: length_text(yLabel) - 1,
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
        animation: true,
        responsive: true,
        scales: {
          x: {
              title: { display: true, text: xLabel },
              type: 'linear',
              min: xMin,
              max: xMax
          },
        
          y: {
              title: { display: true, text: yLabel },
              beginAtZero: true,
              min: yMin,
              max: yMax
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
  while (chart.data.datasets[0].data.length > shiftValue) {
    chart.data.datasets[0].data.shift();
  }
  chart.update();

  chartData[chartIndex].data.push({"x": xVal, "y": yVal, "color": getColorByState(state)});
  chartData[chartIndex].state.push(state);
  while (chartData[chartIndex].data.length > shiftValue) {
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

  if(x === '' || y === '') {
    alert('กรุณาเลือกค่า x และ y');
    return;
  }

  const xMn = parseFloat(document.getElementById('xMn').value);
  const xMx = parseFloat(document.getElementById('xMx').value);
  const yMn = parseFloat(document.getElementById('yMn').value);
  const yMx = parseFloat(document.getElementById('yMx').value);

  createChart(container,{xLabel: x, yLabel: y,xMin : xMn, xMax : xMx, yMin : yMn, yMax : yMx});
  document.getElementById('xMn').value = '';
  document.getElementById('xMx').value = '';
  document.getElementById('yMn').value = '';
  document.getElementById('yMx').value = '';

  n_chart++;
  chartData.push({"name_x": x, "name_y": y, "data": [], "state": []});
});

/* Auto add graph */
document.getElementById('autoAddGraphBtn').addEventListener('click', () => {
  for(let i = 0; i < allLabel.length; i++) {
    for(let j = 0; j < allLabel.length; j++) {
      if(i === j) continue; // ไม่ต้องสร้างกราฟที่ x = y
      if(isText(allLabel[i])) continue;
      createChart(container,{xLabel: allLabel[i], yLabel: allLabel[j]});
    }
  }
});

/* Clear Chart */
document.getElementById('clearGraphBtn').addEventListener('click', () => {
  localStorage.clear();  // ลบข้อมูลทุก key ใน localStorage
  n_chart = 0;
});

/* Reset database */
document.getElementById('resetDbBtn').addEventListener('click', () => {
  fetch('/reset-db', { method: 'POST' })
    .then(res => res.text())
    .then(msg => alert(msg))
    .catch(err => alert('Error: ' + err));
});

/* Number of value before shift */
document.getElementById('addNumber_of_valueBtn').addEventListener('click', () => {
  shiftValue = document.getElementById('number_of_value').value;
  document.getElementById('number_of_value').value = '';
});

/* Serial Data : Flexible monitor and chart update */
socket.on('serial-data', (data) => {
  console.log('Received data:', data);
  document.getElementById('output').textContent =
    `counter: ${data.counter} | state: ${data.state} | latitude: (${data.gps_latitude} | longitude: ${data.gps_longitude}) | apogee: ${data.apogee}m | last_ack: ${data.last_ack} | last_nack: ${data.last_nack}`;

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

  /* Data Table */
  table.innerHTML = ""; // ล้างตารางเก่า
  Object.entries(data).forEach(([key, value]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<th>${key}</th><td>${value}</td>`;
    table.appendChild(tr);
  });

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

