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

// Find and open port
listPorts((err, ports) => {
  if (err) return console.error(err);
  if (ports.length === 0) {
    console.log("No serial ports found!");
    return;
  }

  console.log(`Opening port: ${ports[0].path}`);

  serial = new SerialPort({ path: ports[0].path, baudRate: 115200 });
  parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }));

  // โค้ดอื่นที่ต้องใช้ serial parser รันต่อที่นี่
  parser.on('data', (line) => {
  const trimmed = line.trim();
  console.log('📡 Serial CSV:', trimmed);

  const parts = trimmed.split(',');
  if (parts.length === 17) {
    const [
      time,
      state,
      gps_latitude,
      gps_longitude,
      altitude,
      pyro_a,
      pyro_b,
      temperature,
      pressure,
      acc_x,
      acc_y,
      acc_z,
      gyro_x,
      gyro_y,
      gyro_z,
      last_ack,
      last_nack
    ] = parts;

    // ✅ บันทึกลงฐานข้อมูล
    db.run(
      `INSERT INTO sensor (times, time, state, gps_latitude, gps_longitude, altitude, pyro_a, pyro_b, temperature, pressure, acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z, last_ack, last_nack)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        now.toLocaleTimeString(),
        parseInt(time, 10),
        state,
        parseFloat(gps_latitude),
        parseFloat(gps_longitude),
        parseFloat(altitude),
        pyro_a,
        pyro_b,
        parseFloat(temperature),
        parseFloat(pressure),
        parseFloat(acc_x),
        parseFloat(acc_y),
        parseFloat(acc_z),
        parseFloat(gyro_x),
        parseFloat(gyro_y),
        parseFloat(gyro_z),
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
      time: parseInt(time, 10),
      state,
      gps_latitude: parseFloat(gps_latitude),
      gps_longitude: parseFloat(gps_longitude),
      altitude: parseFloat(altitude),
      pyro_a,
      pyro_b,
      temperature: parseFloat(temperature),
      pressure: parseFloat(pressure),
      acc_x: parseFloat(acc_x),
      acc_y: parseFloat(acc_y),
      acc_z: parseFloat(acc_z),
      gyro_x: parseFloat(gyro_x),
      gyro_y: parseFloat(gyro_y),
      gyro_z: parseFloat(gyro_z),
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
      serial.write(`${msg}\n`);
    }
    
  });
});
});

// ✅ สร้างตารางใหม่ให้ตรงกับข้อมูล 6 ค่า
db.run(`
  CREATE TABLE IF NOT EXISTS sensor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    times TEXT,
    time INTEGER,
    state TEXT,
    gps_latitude REAL,
    gps_longitude REAL,
    altitude REAL,
    pyro_a TEXT,
    pyro_b TEXT,
    temperature REAL,
    pressure REAL,
    acc_x REAL,
    acc_y REAL,
    acc_z REAL,
    gyro_x REAL,
    gyro_y REAL,
    gyro_z REAL,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      times TEXT,
      time INTEGER,
      state TEXT,
      gps_latitude REAL,
      gps_longitude REAL,
      altitude REAL,
      pyro_a TEXT,
      pyro_b TEXT,
      temperature REAL,
      pressure REAL,
      acc_x REAL,
      acc_y REAL,
      acc_z REAL,
      gyro_x REAL,
      gyro_y REAL,
      gyro_z REAL,
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