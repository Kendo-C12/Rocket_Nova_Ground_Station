/*server.js */
const express = require('express');
const path = require('path');
const http = require('http');

// Server
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// dowload csv file
const { Parser } = require('json2csv');
const fs = require('fs');

// Port
const PORT = 1234;

// Init page
app.use(express.static(path.join(__dirname, 'public')));

// Serial
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { callbackify } = require('node:util');
const listPorts = callbackify(SerialPort.list);

let serial;
let parser;
const now = new Date();

// data base
let db = new sqlite3.Database('sensor_data.db');
let db_cmd = new sqlite3.Database('cmd.db');
let db_txData = new sqlite3.Database('txData.db');

/*-------------------------------------------------------------------------------------------------*/

//Function list avalable port
async function listAvailablePorts() {
  try {
    // Get all previously granted ports
    const ports = await navigator.serial.getPorts();

    if (ports.length === 0) {
      console.log("No ports available. Requesting a new one...");
      
      // Ask user to select a port
      const newPort = await navigator.serial.requestPort();
      ports.push(newPort);
    }

    // Display available ports
    ports.forEach((port, index) => {
      console.log(`Port ${index + 1}:`, port.getInfo());
    });

    return ports; // Return the list of ports
  } catch (err) {
    console.error("Error listing ports:", err);
    return [];
  }
}












// Find port
function waitForPort() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      SerialPort.list().then(ports => {
        if (ports.length > 0) {
          clearInterval(interval);
          console.log("Found port:", ports[0].path);
          resolve(ports[0]);
        } else {
          console.log("Waiting for serial port...");
        }
      });
    }, 1000); // เช็คทุก 1 วิ
  });
}

// Find and open port
waitForPort().then(port => {
  console.log(`Opening port: ${port.path}`);

  serial = new SerialPort({ path: port.path, baudRate: 115200 });

  parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }));

  // โค้ดอื่นที่ต้องใช้ serial parser รันต่อที่นี่
  parser.on('data', (line) => {
  const trimmed = line.trim();
  console.log('📡 Serial CSV:', trimmed);

  const parts = trimmed.split(',');
  if (parts.length === 7) {
    const [
      counter,
      state,
      gps_latitude,
      gps_longitude,
      apogee,
      last_ack,
      last_nack
    ] = parts;

    // ✅ บันทึกลงฐานข้อมูล
    db.run(
      `INSERT INTO sensor (counter, times, state, gps_latitude, gps_longitude, apogee, last_ack, last_nack)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(counter, 10),
        now.toLocaleTimeString(),
        state,
        parseFloat(gps_latitude),
        parseFloat(gps_longitude),
        parseFloat(apogee),

        parseInt(last_ack, 10),
        parseInt(last_nack, 10)
      ],
      (err) => {
        if (err) {
          console.error('❌ DB Error:', err.message);
        } else {
          console.log('✅ Inserted:', parts);
        }
      }
    );

    // ✅ ส่งให้หน้าเว็บ
    io.emit('serial-data', {
      counter: parseInt(counter, 10),
      state: state,
      gps_latitude: parseFloat(gps_latitude),
      gps_longitude: parseFloat(gps_longitude),
      apogee: parseFloat(apogee),
      last_ack: parseInt(last_ack, 10),
      last_nack: parseInt(last_nack, 10)
    });
  } else {
    const cmd = trimmed;
    // ✅ บันทึกลงฐานข้อมูล
    db_cmd.run(
      `INSERT INTO cmd (time, cmd)
       VALUES (?, ?)`,
      [
        now.toLocaleTimeString(),
        cmd
      ],
      (err) => {
        if (err) {
          console.error('❌ DB Error:', err.message);
        } else {
          console.log('✅ Inserted:', cmd);
        }
      }
    );

    // ✅ ส่งให้หน้าเว็บ
    io.emit('cmd-data', {
      cmd : cmd
    });
  }
});

io.on('connection', (socket) => {
  console.log('🌐 Web client connected');

  socket.on('uplink', (msg) => {
    console.log('🔄 Received command from client:', msg);

    // คุณสามารถส่งคำสั่งนี้ออก serial port ได้ เช่น:
    if (serial && serial.writable) {
      serial.write(`cmd ${msg}\n`);
    }
    
  });
});
});

// ✅ สร้างตารางใหม่ให้ตรงกับข้อมูล 6 ค่า
db.run(`
  CREATE TABLE IF NOT EXISTS sensor (
    counter INTEGER,
    times TEXT,
    state TEXT,
    gps_latitude REAL,
    gps_longitude REAL,
    apogee REAL,
    last_ack INTEGER,
    last_nack INTEGER
  )
`);
db_cmd.run(`
  CREATE TABLE IF NOT EXISTS cmd (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT,
    cmd TEXT
  )
`);

/* dowload data */
app.get('/download_sensor', (req, res) => {
  db.all("SELECT * FROM sensor", [], (err, rows) => {
    if (err) throw err;

    if (rows.length === 0) {
      console.log("No data to export");
      return;
    }

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('sensor_data.csv');
    res.send(csv);
  });
});
app.get('/download_cmd', (req, res) => {
  db_cmd.all("SELECT * FROM cmd", [], (err, rows) => {
    if (err) throw err;
    
    if (rows.length === 0) {
      console.log("No data to export");
      return;
    }
    const parser = new Parser();
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('cmd_data.csv');
    res.send(csv);
  });
});

/* Reset Database */
app.post('/reset-db', (req, res) => {
  // ลบไฟล์เก่า
  if (fs.existsSync('sensor_data.db')) {
    fs.unlinkSync('sensor_data.db');
  }
  if (fs.existsSync('cmd.db')) {
    fs.unlinkSync('cmd.db');
  }
  
  db = new sqlite3.Database('sensor_data.db');
  db_cmd = new sqlite3.Database('cmd.db');

  db.run(`
    CREATE TABLE IF NOT EXISTS sensor (
      counter INTEGER,
      state TEXT,
      gps_latitude REAL,
      gps_longitude REAL,
      apogee REAL,
      last_ack INTEGER,
      last_nack INTEGER
    )
  `);
  db_cmd.run(`
    CREATE TABLE IF NOT EXISTS cmd (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT,
      cmd TEXT
    )
  `);
  db.close();
  db_cmd.close();
  res.send('Database has been reset!');
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

//run function