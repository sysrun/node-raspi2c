var i2c_device = require('../i2c_device'),
    sys = require('sys');


var DS1340 = module.exports = function(address, busnum) {
  i2c_device.call(this, busnum, address);
  this.address = address;
};

sys.inherits(DS1340, i2c_device);

DS1340.prototype.setTime = function(dateValue, cb) {
  var _self = this;

  var data = [
    bin2bcd(dateValue.getSeconds()),
    bin2bcd(dateValue.getMinutes()),
    bin2bcd(dateValue.getHours()),
    bin2bcd(dateValue.getDay()),
    bin2bcd(dateValue.getDate()),
    bin2bcd(dateValue.getMonth()),
    bin2bcd(dateValue.getFullYear()-2000)
  ];
  _self._writeBytes(0x00, data, cb);

};

// Return Javascript Date Object
DS1340.prototype.getTime = function(cb) {
  var _self = this;

  _self._readBytes(0x00, 7, function(er,data){
    if (er) {cb(er);return;}
    var dt = {
      ss: bcd2bin(data[0]),
      mm: bcd2bin(data[1]),
      hh: bcd2bin(data[2]),
      day: bcd2bin(data[3]),
      d: bcd2bin(data[4]),
      m: bcd2bin(data[5]),
      y: bcd2bin(data[6])+2000
    };
    cb(null, new Date(dt.y, dt.m, dt.d, dt.hh, dt.mm, dt.ss));
  });
};

function bcd2bin(val) {
  return val - 6 * (val >> 4);
}

function bin2bcd (val) {
  return val + 6 * Math.floor(val / 10);
}
