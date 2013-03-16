/*
Demo for Adafruit Blue&White 16x2 LCD+Keypad Kit for Raspberry Pi

 - https://www.adafruit.com/products/1115
 */

var lcdDevice = require('../lib/devices/ADAFRUIT_LCD_HD44780_MCP23017');

/* 
 Default options
 {
    busnum: 0,
    address: 0x20,
    pin_rs: 15,
    pin_e: 13,
    pins_db: [12, 11, 10, 9],
    pin_rw: 14
 }
  */

new lcdDevice({busnum: 1}, function(lcd){

  console.log('clearing');
  lcd.clear(function(){

    console.log('clear done');

    lcd.blink(function(){

      lcd.message('WakaLuba', function(){

        console.log('done');

      });
    });
  });
});
