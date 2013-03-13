var DS1340 = require('../../lib/devices/DS1340');

var device = new DS1340(0x68, 1);

device.getTime(function(error, timeObject){
  console.error(error);
  console.log(timeObject);
});
