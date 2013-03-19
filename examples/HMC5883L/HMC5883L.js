var dev = require('../lib/devices/HMC5883L');

var compass = new dev(0x1e, 1, {
  avg_samples: 0,
  data_rate: 30
});
console.log(compass);
function read() {
  compass.read();
  setTimeout(read, 250);
};

read();

