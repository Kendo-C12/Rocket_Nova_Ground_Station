#include <Arduino.h>

// int time;

// void setup() {
//   Serial.begin(9600);
// }

// void loop() {
//   delay(1000); // Delay for 1 second to avoid flooding the serial output
//   Serial.println("{\"0\": [1]}");
// }
String input;
void setup() {
  Serial.begin(115200);

}

void loop() {
  // Example simulated values for the "0" list
//   Serial.println(
//     "{\"0\": [" +
//     String(millis()) + "," +                       // Timestamp
//     String(micros()) + "," +                       // Timestamp (microsecond)
//     String(millis()) + "," +                       // Milliseconds since boot
//     String(random(0, 500)) + "," +                  // Packet Counter
//     "RUNNING," +                                    // Program State
//     "NORMAL," +                                     // Pressure sensors mode
//     "ENABLED," +                                    // IMU sensors mode
//     String(13.7563 + random(-100, 100) / 10000.0, 6) + "," + // GPS Latitude
//     String(100.5018 + random(-100, 100) / 10000.0, 6) + "," +// GPS Longitude
//     String(150.0 + random(-50, 50) / 10.0, 2) + "," +        // Reference Altitude
//     "1,0,0," +                                       // Pyro states
//     "1,1,1," +                                       // Pyro continuity
//     String(25.0 + random(-50, 50) / 10.0, 2) + "," + // MS#1 Temp
//     String(1013.0 + random(-50, 50) / 100.0, 2) + "," + // MS#1 Pressure
//     String(50.0 + random(-100, 100) / 10.0, 2) + "," + // MS#1 Altitude
//     String(25.0 + random(-50, 50) / 10.0, 2) + "," + // MS#2 Temp
//     String(1013.0 + random(-50, 50) / 100.0, 2) + "," + // MS#2 Pressure
//     String(50.0 + random(-100, 100) / 10.0, 2) + "," + // MS#2 Altitude
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM42688 Accel X
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM42688 Accel Y
//     String(9.80 + random(-10, 10) / 100.0, 2) + "," + // ICM42688 Accel Z
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM42688 Gyro X
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM42688 Gyro Y
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM42688 Gyro Z
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM20948 Accel X
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM20948 Accel Y
//     String(9.80 + random(-10, 10) / 100.0, 2) + "," + // ICM20948 Accel Z
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM20948 Gyro X
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM20948 Gyro Y
//     String(random(-10, 10) / 100.0, 2) + "," +      // ICM20948 Gyro Z
//     String(45.0 + random(-50, 50) / 10.0, 1) + "," + // CPU Temp
//     String(12.0 + random(-10, 10) / 10.0, 2) + "," + // Battery Voltage
//     "ACK," +                                        // Last ACK
//     "NACK" +                                        // Last NACK
//     "]}"                                           // Close JSON array and object
//   );

//   Serial.println(input);
//   if(Serial.available()) {
//     input = Serial.readStringUntil('\n');
//   }
  Serial.println("[1]");
  delay(1000);
}