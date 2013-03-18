# raspi2c

Bindings for i2c-dev lib. Helpers for different devices. Plays well with Raspberry Pi.

Have a look at the example folder!

## Updates


**v0.0.5**

  - New method "ReadBlockData" for upcoming HMC5883L Device (compass)

**v0.0.4**

  - device: Adafruit LCD Shield: emit events for buttons

**v0.0.3**

 - new device: MCP23xx (MCP23017 & 23008)
 - small demo for Adafruit RPi LCD Shield

# Install

````bash
$ npm install raspi2c
````

# Raspberry Pi Setup

````bash
$ sudo vi /etc/modprobe.d/raspi-blacklist.conf
````

Comment out blacklist i2c-bcm2708

````
#blacklist i2c-bcm2708
````

Load kernel module

````bash
$ modprobe i2c-bcm2708
````
Thanks to @korevec (https://github.com/korevec/node-i2c)
