// #include <Arduino_Extended.h>
#include <SPI.h>
#include <RadioLib.h>
// #include <lib_xcore>

String str;  // instead of String str;
uint8_t state;

// LoRa parameters
constexpr struct {
  float center_freq = 920600000.f; // MHz
  float bandwidth = 125.f;          // kHz
  uint8_t spreading_factor = 9;     // SF: 6–12
  uint8_t coding_rate = 8;          // CR: 5–8
  uint8_t sync_word = 0x12;         // private sync
  int8_t power = 22;                // up to 22 dBm
  uint16_t preamble_length = 16;
} lora_params;

// SX1262 pin connections
#define LORA_DIO1 2   //Interupt
#define LORA_NSS  10   //Chip selected
#define LORA_BUSY 4    //Digital
#define LORA_NRST 3    //Digital

// SPI
SPIClass spi1; // (11, 12, 13); // MOSI, MISO, SCK
SPISettings lora_spi_config(18000000, MSBFIRST, SPI_MODE0);

Module *lora_module = new Module(LORA_NSS, LORA_DIO1, LORA_NRST, LORA_BUSY,
                                 spi1, lora_spi_config);
SX1262 lora = lora_module;   // create driver instance

float lora_rssi = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Hello!");

  // LoRa init
  int16_t lora_state = lora.begin(lora_params.center_freq,
                                  lora_params.bandwidth,
                                  lora_params.spreading_factor,
                                  lora_params.coding_rate,
                                  lora_params.sync_word,
                                  lora_params.power,
                                  lora_params.preamble_length,
                                  0,
                                  false);

  lora_state = lora_state || lora.explicitHeader();
  lora_state = lora_state || lora.setCRC(true);
  lora_state = lora_state || lora.autoLDRO();

  if (lora_state == RADIOLIB_ERR_NONE) {
    Serial.println("SX1262 LoRa SUCCESS");
  } else {
    Serial.print("Initialization failed! Error: ");
    Serial.println(lora_state);
    while(1);
  }
  delay(3000);
  
}

void loop() {
  Serial.print(F("[SX1262] Waiting for incoming transmission ... "));

  state = lora.receive(str);   // <-- blocking receive

  if (state == RADIOLIB_ERR_NONE) {
    Serial.println(F("success!"));

    Serial.print(F("[SX1262] Data:\t\t"));
    Serial.println(str);

    Serial.print(F("[SX1262] RSSI:\t\t"));
    Serial.print(lora.getRSSI());
    Serial.println(F(" dBm"));

    Serial.print(F("[SX1262] SNR:\t\t"));
    Serial.print(lora.getSNR());
    Serial.println(F(" dB"));

    Serial.print(F("[SX1262] Frequency error:\t"));
    Serial.print(lora.getFrequencyError());
    Serial.println(F(" Hz"));

  } else if (state == RADIOLIB_ERR_RX_TIMEOUT) {
    Serial.println(F("timeout!"));
  } else if (state == RADIOLIB_ERR_CRC_MISMATCH) {
    Serial.println(F("CRC error!"));
  } else {
    Serial.print(F("failed, code "));
    Serial.println(state);
  }
}
