var DS1340 = require('../../lib/devices/DS1340');

var device = new DS1340(0x68, 1);

var date = new Date();

console.log('Setting date to', date);

device.setTime(date, function(er){
  console.log('Error:', er);
});
