Require software
- Node.js
- npm

Feature                         Work or not
- Monitor                       Y
- Uplink                        Y
- Chart                         
        Text Chart              N
        Number Chart            Y
        Add and Clear Chart     Y       
- Database
        Sensor db               Y
        Cmd db                  Y
        Reset db                N

How to use
1. change directory to ../BOARD_GROUND_ROCKET/UX_UI         :        cd UX_UI
2. hosting                                                  :        node seerver.js
3. go to http://localhost:1234/

Warning
- Connect ground's board to PC before hosting or else it will error
- When hosting please connect only one port or else it will monitor first port it found
          if you know coding you can change code in ../BOARD_GROUND_ROCKET/UX_UI/server.js line 47 to serial = new SerialPort({ path: YourPort, baudRate: YourBlaudeate });

About database
- due to lazy of maker current reset database button not work if you want to reset database do these follow step
          1. stop hosting
          2. delete cmd.db and sensor_data.db
          3. host again
