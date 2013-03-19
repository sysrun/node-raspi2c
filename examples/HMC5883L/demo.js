var dev = require('../../lib/devices/HMC5883L');


// new device with address 0x1e on Bus no.1
var compass = new dev(0x1e, 1);

// Init compass with give options
compass.init({
  avg_samples: 0,
  data_rate: 30
}, function(er) {

  // Log initialization errors
  if (er) {
    console.error(er);
  }

  // run read function every 250ms
  function read() {
    compass.read();
    setTimeout(read, 250);
  }

  read();
});
