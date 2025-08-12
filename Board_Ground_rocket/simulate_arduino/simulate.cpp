#include <Arduino.h>

int time;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  time = 0;
}

void loop() {
  time++;
  Serial.print(time);
  Serial.print(",");
  Serial.print("STARTUP");
  Serial.print(",");
  Serial.print(100);
  Serial.print(",");
  Serial.print(100);
  Serial.print(",");
  Serial.print(100);
  Serial.print(",");
  Serial.print("D");
  Serial.print(",");
  Serial.print("D");
  Serial.print(",");
  Serial.print(1);
  Serial.print(",");
  Serial.print(1);
  Serial.print(",");
  Serial.print(3);
  Serial.print(",");
  Serial.print(3);
  Serial.print(",");
  Serial.print(3);
  Serial.print(",");
  Serial.print(4);
  Serial.print(",");
  Serial.print(4);
  Serial.print(",");
  Serial.print(4);
  Serial.print(",");
  Serial.print(2);
  Serial.print(",");
  Serial.println(2);
  delay(1000); // Delay for 1 second to avoid flooding the serial output
}