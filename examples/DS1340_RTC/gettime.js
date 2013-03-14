var DS1340 = require('../../lib/devices/DS1340');

// Deviceadress 0x68
// Raspberry i2c-bus no. 1

var device = new DS1340(0x68, 1);

device.getTime(function(error, timeObject){
  console.error(error);
  console.log(timeObject);
});
