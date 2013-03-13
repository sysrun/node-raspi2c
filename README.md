# raspi2c

Bindings for i2c-dev lib. Helpers for different devices. Plays well with Raspberry Pi.

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
